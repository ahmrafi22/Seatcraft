namespace SeatCraft.Domain.Solver;

/// <summary>
/// Sequential colouring with DSATUR-style slot ordering: the institution with the
/// most remaining candidates always picks the least-constrained free seat.
/// </summary>
public sealed class BalancedAllocationStrategy : ISeatAllocationStrategy
{
    public string Name => "Balanced";

    public AllocationOutcome Allocate(
        SolverInput input,
        SeatGrid grid,
        IProgress<SolverProgress>? progress,
        CancellationToken cancellationToken)
    {
        var state = new AllocationState(input, grid);
        var freeSlots = new List<int>(Enumerable.Range(0, grid.Count));
        var placed = 0;
        var total = input.Candidates.Count;

        while (placed < total && freeSlots.Count > 0)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var institution = state.InstitutionsByRemainingDescending().FirstOrDefault(-1);
            if (institution < 0)
                break;

            var slot = PickSlot(state, freeSlots, institution, input.Constraints);

            state.Assign(slot, state.PeekNextCandidate(institution), institution);
            freeSlots.Remove(slot);
            placed++;

            if (placed % 250 == 0)
            {
                progress?.Report(new SolverProgress(
                    placed * 100 / total,
                    $"Placing candidates {placed}/{total}",
                    state.TotalAdjacentConflicts()));
            }
        }

        return new AllocationOutcome(state.SlotByCandidate, IsOptimal: false);
    }

    private static int PickSlot(
        AllocationState state,
        List<int> freeSlots,
        int institution,
        ValueObjects.AllocationConstraints constraints)
    {
        if (!constraints.PreventSameInstitutionAdjacent)
            return freeSlots[0];

        var bestSlot = -1;
        var bestPressure = int.MaxValue;

        foreach (var slot in freeSlots)
        {
            var conflicts = state.AdjacentConflictCount(slot);

            if (conflicts == 0 && !state.ConflictsWithNeighbors(slot, institution))
                return slot;

            if (conflicts < bestPressure)
            {
                bestPressure = conflicts;
                bestSlot = slot;
            }
        }

        return bestSlot >= 0 ? bestSlot : freeSlots[0];
    }
}
