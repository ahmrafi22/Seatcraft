namespace SeatCraft.Domain.Solver;

/// <summary>
/// Naive baseline: first-fit in roll order, ignoring adjacency. Included so the
/// benchmark can show what the smarter strategies actually buy.
/// </summary>
public sealed class GreedyAllocationStrategy : ISeatAllocationStrategy
{
    public string Name => "Greedy";

    public AllocationOutcome Allocate(
        SolverInput input,
        SeatGrid grid,
        IProgress<SolverProgress>? progress,
        CancellationToken cancellationToken)
    {
        var state = new AllocationState(input, grid);

        var ordered = Enumerable.Range(0, input.Candidates.Count)
            .OrderBy(index => input.Candidates[index].Roll, StringComparer.Ordinal)
            .ToList();

        var slot = 0;
        var placed = 0;
        var total = ordered.Count;

        foreach (var candidateIndex in ordered)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (slot >= grid.Count)
                break;

            state.ForceAssign(slot, candidateIndex, state.InstitutionOfCandidate(candidateIndex));
            slot++;
            placed++;

            if (placed % 250 == 0)
                progress?.Report(new SolverProgress(placed * 100 / total, $"Placing candidates {placed}/{total}", 0));
        }

        return new AllocationOutcome(state.SlotByCandidate, IsOptimal: false);
    }
}
