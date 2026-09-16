namespace SeatCraft.Domain.Solver;

/// <summary>
/// Independent verification of a plan. Deliberately does not reuse the solver's
/// state so a hand-edited plan is checked with the same rules as a generated one.
/// </summary>
public static class PlanValidator
{
    public static IReadOnlyList<PlanViolation> Validate(
        IReadOnlyList<SolverCandidate> candidates,
        IReadOnlyList<SeatPlacement> placements,
        SeatGrid grid,
        ValueObjects.AllocationConstraints constraints)
    {
        var violations = new List<PlanViolation>();
        var candidateById = candidates.ToDictionary(c => c.Id);
        var slotByCandidate = new Dictionary<Guid, int>();
        var candidateBySlot = new Dictionary<int, Guid>();

        var slotIndex = grid.Slots.ToDictionary(slot => (slot.HallId, slot.Row, slot.Column), slot => slot.Index);

        foreach (var placement in placements)
        {
            if (!slotIndex.TryGetValue((placement.HallId, placement.Row, placement.Column), out var slot))
            {
                violations.Add(new PlanViolation(
                    ViolationKind.SubjectGroupSplit,
                    $"Seat {placement.Label} in hall {placement.HallId} is not a usable seat.",
                    placement.CandidateId));
                continue;
            }

            if (candidateBySlot.TryGetValue(slot, out var occupant))
            {
                violations.Add(new PlanViolation(
                    ViolationKind.SubjectGroupSplit,
                    $"Seat {placement.Label} is assigned to more than one candidate.",
                    placement.CandidateId,
                    occupant));
                continue;
            }

            candidateBySlot[slot] = placement.CandidateId;
            slotByCandidate[placement.CandidateId] = slot;
        }

        foreach (var (slot, candidateId) in candidateBySlot)
        {
            var candidate = candidateById[candidateId];

            foreach (var neighbor in grid.NeighborsOf(slot))
            {
                if (!candidateBySlot.TryGetValue(neighbor, out var neighborCandidateId) || neighbor > slot)
                    continue;

                var neighborCandidate = candidateById[neighborCandidateId];

                if (constraints.PreventSameInstitutionAdjacent &&
                    neighborCandidate.InstitutionId == candidate.InstitutionId)
                {
                    violations.Add(new PlanViolation(
                        ViolationKind.SameInstitutionAdjacent,
                        $"Candidates from the same institution are adjacent at {grid.Slots[slot].Label}.",
                        candidateId,
                        neighborCandidateId));
                }
            }
        }

        if (constraints.MaintainRollOrder)
            violations.AddRange(CheckRollOrder(candidates, slotByCandidate, grid));

        return violations;
    }

    private static IEnumerable<PlanViolation> CheckRollOrder(
        IReadOnlyList<SolverCandidate> candidates,
        Dictionary<Guid, int> slotByCandidate,
        SeatGrid grid)
    {
        var ordered = candidates
            .Where(candidate => slotByCandidate.ContainsKey(candidate.Id))
            .OrderBy(candidate => candidate.Roll, StringComparer.Ordinal)
            .ToList();

        var violations = new List<PlanViolation>();
        var inversions = 0;

        for (var i = 1; i < ordered.Count; i++)
        {
            if (slotByCandidate[ordered[i].Id] < slotByCandidate[ordered[i - 1].Id])
                inversions++;
        }

        // A handful of inversions is acceptable; a plan that scatters rolls is not.
        if (ordered.Count > 0 && inversions > ordered.Count / 4)
        {
            violations.Add(new PlanViolation(
                ViolationKind.RollOrderBroken,
                $"{inversions} roll-order inversions detected; attendance sheets would be hard to follow."));
        }

        return violations;
    }
}
