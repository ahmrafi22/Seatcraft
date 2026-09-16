using System.Diagnostics;
using SeatCraft.Domain.Common;
using SeatCraft.Domain.Enums;

namespace SeatCraft.Domain.Solver;

/// <summary>Entry point for seat allocation. Pure: no I/O, no clock, deterministic for a given seed.</summary>
public sealed class SeatAllocationSolver
{
    private readonly IReadOnlyDictionary<AllocationStrategyKind, ISeatAllocationStrategy> _strategies;

    public SeatAllocationSolver()
        : this(new Dictionary<AllocationStrategyKind, ISeatAllocationStrategy>
        {
            [AllocationStrategyKind.Greedy] = new GreedyAllocationStrategy(),
            [AllocationStrategyKind.Balanced] = new BalancedAllocationStrategy(),
            [AllocationStrategyKind.Strict] = new StrictAllocationStrategy()
        })
    {
    }

    public SeatAllocationSolver(IReadOnlyDictionary<AllocationStrategyKind, ISeatAllocationStrategy> strategies) =>
        _strategies = strategies;

    public SolverResult Solve(SolverInput input, IProgress<SolverProgress>? progress = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(input);

        EnsureFeasible(input);

        if (input.Candidates.Count == 0)
        {
            return new SolverResult(
                [], [], PlanMetricsCalculator.Calculate([], [], SeatGrid.Build(input.Halls), 0, 0),
                IsOptimal: true, CompletedWithinTimeLimit: true);
        }

        var grid = SeatGrid.Build(input.Halls);
        var stopwatch = Stopwatch.StartNew();
        var completed = true;

        using var timeLimitSource = new CancellationTokenSource();
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeLimitSource.Token);

        if (input.TimeLimit is { } limit)
            timeLimitSource.CancelAfter(limit);

        AllocationOutcome outcome;

        try
        {
            outcome = Resolve(input.Strategy).Allocate(input, grid, progress, linked.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            completed = false;
            outcome = new AllocationOutcome(Enumerable.Repeat(-1, input.Candidates.Count).ToArray(), IsOptimal: false);
        }

        stopwatch.Stop();

        var placements = BuildPlacements(input, grid, outcome);
        var violations = PlanValidator.Validate(input.Candidates, placements, grid, input.Constraints);
        var metrics = PlanMetricsCalculator.Calculate(
            input.Candidates,
            placements,
            grid,
            violations.Count,
            stopwatch.ElapsedMilliseconds);

        return new SolverResult(placements, violations, metrics, outcome.IsOptimal, completed);
    }

    private ISeatAllocationStrategy Resolve(AllocationStrategyKind kind) =>
        _strategies.TryGetValue(kind, out var strategy)
            ? strategy
            : throw new DomainException($"Allocation strategy '{kind}' is not registered.");

    private static IReadOnlyList<SeatPlacement> BuildPlacements(SolverInput input, SeatGrid grid, AllocationOutcome outcome)
    {
        var placements = new List<SeatPlacement>(outcome.SlotByCandidate.Length);

        for (var candidateIndex = 0; candidateIndex < outcome.SlotByCandidate.Length; candidateIndex++)
        {
            var slot = outcome.SlotByCandidate[candidateIndex];
            if (slot < 0)
                continue;

            var seat = grid.Slots[slot];
            placements.Add(new SeatPlacement(input.Candidates[candidateIndex].Id, seat.HallId, seat.Row, seat.Column));
        }

        return placements;
    }

    /// <summary>Fails fast with an actionable message instead of returning a silently broken plan.</summary>
    private static void EnsureFeasible(SolverInput input)
    {
        if (input.Halls.Count == 0 && input.Candidates.Count > 0)
            throw new DomainException("At least one hall is required before allocating seats.");

        var grid = SeatGrid.Build(input.Halls);

        if (grid.Count < input.Candidates.Count)
        {
            throw new DomainException(
                $"Not enough usable seats: {input.Candidates.Count} candidates but only {grid.Count} seats available.");
        }

        var duplicates = input.Candidates
            .GroupBy(candidate => candidate.Roll, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .Take(5)
            .ToList();

        if (duplicates.Count > 0)
            throw new DomainException($"Duplicate roll numbers found: {string.Join(", ", duplicates)}.");

        if (!input.Constraints.PreventSameInstitutionAdjacent)
            return;

        var largestInstitution = input.Candidates
            .GroupBy(candidate => candidate.InstitutionId)
            .OrderByDescending(group => group.Count())
            .FirstOrDefault();

        if (largestInstitution is null)
            return;

        var limit = LargestIndependentSetBound(grid);

        if (largestInstitution.Count() > limit)
        {
            throw new DomainException(
                $"Institution {largestInstitution.Key} has {largestInstitution.Count()} candidates but the halls can hold " +
                $"at most {limit} of them without two sitting side by side.");
        }
    }

    /// <summary>
    /// Upper bound on how many same-institution candidates fit in a grid with no two
    /// orthogonally adjacent: a checkerboard colouring of the seat graph.
    /// </summary>
    private static int LargestIndependentSetBound(SeatGrid grid)
    {
        var colorA = 0;
        var colorB = 0;

        foreach (var slot in grid.Slots)
        {
            if ((slot.Row + slot.Column) % 2 == 0)
                colorA++;
            else
                colorB++;
        }

        return Math.Max(colorA, colorB);
    }
}
