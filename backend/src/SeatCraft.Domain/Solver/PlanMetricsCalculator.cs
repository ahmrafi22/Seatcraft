namespace SeatCraft.Domain.Solver;

public static class PlanMetricsCalculator
{
    public static PlanMetrics Calculate(
        IReadOnlyList<SolverCandidate> candidates,
        IReadOnlyList<SeatPlacement> placements,
        SeatGrid grid,
        int violationCount,
        long durationMs)
    {
        var hallsUsed = placements.Select(p => p.HallId).Distinct().Count();
        var seatCount = placements.Count;

        var capacityWaste = grid.Count == 0
            ? 0d
            : Math.Round((grid.Count - seatCount) * 100d / grid.Count, 2);

        return new PlanMetrics(
            CandidateCount: candidates.Count,
            SeatCount: seatCount,
            HallsUsed: hallsUsed,
            ViolationCount: violationCount,
            CapacityWastePercent: capacityWaste,
            InstitutionSpread: InstitutionSpread(candidates, placements),
            RollSequenceScore: RollSequenceScore(candidates, placements, grid),
            DurationMs: durationMs);
    }

    /// <summary>Share of horizontally adjacent pairs belonging to different institutions. Higher is better.</summary>
    private static double InstitutionSpread(
        IReadOnlyList<SolverCandidate> candidates,
        IReadOnlyList<SeatPlacement> placements)
    {
        var institutionById = candidates.ToDictionary(c => c.Id, c => c.InstitutionId);

        var mixed = 0;
        var total = 0;

        foreach (var row in placements.GroupBy(p => (p.HallId, p.Row)))
        {
            var ordered = row.OrderBy(p => p.Column).ToList();

            for (var i = 1; i < ordered.Count; i++)
            {
                total++;

                if (institutionById[ordered[i].CandidateId] != institutionById[ordered[i - 1].CandidateId])
                    mixed++;
            }
        }

        return total == 0 ? 0d : Math.Round(mixed * 100d / total, 2);
    }

    /// <summary>Percentage of consecutive roll pairs whose seats stay in the same order as the roll.</summary>
    private static double RollSequenceScore(
        IReadOnlyList<SolverCandidate> candidates,
        IReadOnlyList<SeatPlacement> placements,
        SeatGrid grid)
    {
        var slotIndex = grid.Slots.ToDictionary(s => (s.HallId, s.Row, s.Column), s => s.Index);

        var slotByCandidate = placements
            .Where(p => slotIndex.ContainsKey((p.HallId, p.Row, p.Column)))
            .ToDictionary(p => p.CandidateId, p => slotIndex[(p.HallId, p.Row, p.Column)]);

        var ordered = candidates
            .Where(c => slotByCandidate.ContainsKey(c.Id))
            .OrderBy(c => c.Roll, StringComparer.Ordinal)
            .ToList();

        if (ordered.Count < 2)
            return 100d;

        var inOrder = 0;

        for (var i = 1; i < ordered.Count; i++)
        {
            if (slotByCandidate[ordered[i].Id] > slotByCandidate[ordered[i - 1].Id])
                inOrder++;
        }

        return Math.Round(inOrder * 100d / (ordered.Count - 1), 2);
    }
}
