namespace SeatCraft.Domain.Solver;

/// <summary>
/// Balanced placement followed by iterative repair. Repair uses improving swaps,
/// then sideways moves and random kicks to escape local minima, which a purely
/// greedy repair cannot do.
/// </summary>
public sealed class StrictAllocationStrategy : ISeatAllocationStrategy
{
    private readonly BalancedAllocationStrategy _seed = new();
    private readonly int _maxAttempts;

    public StrictAllocationStrategy(int maxAttempts = 30) => _maxAttempts = maxAttempts;

    public string Name => "Strict";

    public AllocationOutcome Allocate(
        SolverInput input,
        SeatGrid grid,
        IProgress<SolverProgress>? progress,
        CancellationToken cancellationToken)
    {
        var seeded = _seed.Allocate(input, grid, progress, cancellationToken);

        if (!input.Constraints.PreventSameInstitutionAdjacent)
            return seeded with { IsOptimal = true };

        var state = AllocationStateFactory.FromOutcome(input, grid, seeded);
        var best = state.TotalAdjacentConflicts();

        if (best == 0)
            return new AllocationOutcome(state.SlotByCandidate, IsOptimal: true);

        var bestSlots = (int[])state.SlotByCandidate.Clone();
        var random = new Random(input.Seed == 0 ? 1 : input.Seed);

        for (var attempt = 0; attempt < _maxAttempts && best > 0; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            RepairPass(state, grid, cancellationToken);
            var current = state.TotalAdjacentConflicts();

            if (current < best)
            {
                best = current;
                bestSlots = (int[])state.SlotByCandidate.Clone();
            }

            progress?.Report(new SolverProgress(
                Math.Min(99, 50 + attempt * 2),
                $"Repairing conflicts (attempt {attempt + 1}, {best} left)",
                best));

            if (best == 0)
                break;

            Kick(state, grid, random);
        }

        return new AllocationOutcome(bestSlots, IsOptimal: best == 0);
    }

    private static void RepairPass(AllocationState state, SeatGrid grid, CancellationToken cancellationToken)
    {
        var improved = true;

        while (improved)
        {
            improved = false;

            for (var slot = 0; slot < grid.Count; slot++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (state.AdjacentConflictCount(slot) == 0)
                    continue;

                var baseline = state.TotalAdjacentConflicts();

                for (var other = 0; other < grid.Count; other++)
                {
                    if (other == slot)
                        continue;

                    // Try a swap; fall back to moving into the empty slot, since a
                    // conflict caused by a crowded institution is often only fixable
                    // by spreading into free seats.
                    var swapped = state.Swap(slot, other);

                    if (swapped)
                    {
                        if (state.TotalAdjacentConflicts() < baseline)
                        {
                            improved = true;
                            break;
                        }

                        state.Swap(slot, other);
                    }
                    else if (state.Move(slot, other))
                    {
                        if (state.TotalAdjacentConflicts() < baseline)
                        {
                            improved = true;
                            break;
                        }

                        state.Move(other, slot);
                    }
                }
            }
        }
    }

    /// <summary>Randomly relocates a conflicting candidate to escape a local minimum.</summary>
    private static void Kick(AllocationState state, SeatGrid grid, Random random)
    {
        var conflicting = Enumerable.Range(0, grid.Count)
            .Where(slot => state.AdjacentConflictCount(slot) > 0)
            .ToList();

        if (conflicting.Count == 0)
            return;

        var from = conflicting[random.Next(conflicting.Count)];
        var to = random.Next(grid.Count);

        state.Swap(from, to);
    }
}
