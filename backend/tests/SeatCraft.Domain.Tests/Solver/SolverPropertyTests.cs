using FsCheck;
using FsCheck.Fluent;
using FsCheck.Xunit;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;

namespace SeatCraft.Domain.Tests.Solver;

/// <summary>
/// Invariants that must hold for every generated plan, not just the scenarios we
/// thought of by hand.
/// </summary>
public class SolverPropertyTests
{
    private readonly SeatAllocationSolver _solver = new();

    public static Arbitrary<GridScenario> GridScenarios()
    {
        var generator =
            from rows in Gen.Choose(1, 6)
            from columns in Gen.Choose(1, 6)
            from candidates in Gen.Choose(1, 12)
            from institutions in Gen.Choose(2, 4)
            from blocked in Gen.Choose(0, 2)
            select new GridScenario(rows, columns, candidates, institutions, blocked);

        return Arb.From(generator);
    }

    [Property(MaxTest = 200, Arbitrary = [typeof(SolverPropertyTests)])]
    public bool Plan_NeverPlacesTwoCandidatesInOneSeat(GridScenario scenario)
    {
        var (_, result) = Solve(scenario);
        if (result is null)
            return true;

        var seats = result.Placements.Select(p => (p.HallId, p.Row, p.Column)).ToList();

        return seats.Count == seats.Distinct().Count();
    }

    [Property(MaxTest = 200, Arbitrary = [typeof(SolverPropertyTests)])]
    public bool Plan_AssignsEachCandidateAtMostOnce(GridScenario scenario)
    {
        var (_, result) = Solve(scenario);
        if (result is null)
            return true;

        var candidates = result.Placements.Select(p => p.CandidateId).ToList();

        return candidates.Count == candidates.Distinct().Count();
    }

    [Property(MaxTest = 200, Arbitrary = [typeof(SolverPropertyTests)])]
    public bool Plan_StaysWithinUsableSeats(GridScenario scenario)
    {
        var (input, result) = Solve(scenario);
        if (result is null)
            return true;

        var grid = SeatGrid.Build(input.Halls);
        var usable = grid.Slots.Select(s => (s.HallId, s.Row, s.Column)).ToHashSet();

        return result.Placements.All(p => usable.Contains((p.HallId, p.Row, p.Column)));
    }

    [Property(MaxTest = 200, Arbitrary = [typeof(SolverPropertyTests)])]
    public bool Strict_ProducesNoAdjacencyViolations_WhenSeatsAllow(GridScenario scenario)
    {
        var (input, result) = Solve(scenario, AllocationStrategyKind.Strict);
        if (result is null || !result.CompletedWithinTimeLimit)
            return true;

        var grid = SeatGrid.Build(input.Halls);

        var maxInstitution = input.Candidates
            .GroupBy(c => c.InstitutionId)
            .Max(g => g.Count());

        var bound = Math.Max(
            grid.Slots.Count(s => (s.Row + s.Column) % 2 == 0),
            grid.Slots.Count(s => (s.Row + s.Column) % 2 == 1));

        if (maxInstitution > bound)
            return true;

        return result.Violations.All(v => v.Kind != ViolationKind.SameInstitutionAdjacent);
    }

    [Property(MaxTest = 100, Arbitrary = [typeof(SolverPropertyTests)])]
    public bool Plan_IsDeterministic(GridScenario scenario)
    {
        var (input, first) = Solve(scenario);
        if (first is null)
            return true;

        var second = _solver.Solve(input);

        return first.Placements
            .OrderBy(p => p.CandidateId)
            .Select(p => (p.HallId, p.Row, p.Column))
            .SequenceEqual(second.Placements
                .OrderBy(p => p.CandidateId)
                .Select(p => (p.HallId, p.Row, p.Column)));
    }

    private (SolverInput Input, SolverResult? Result) Solve(
        GridScenario scenario,
        AllocationStrategyKind strategy = AllocationStrategyKind.Balanced)
    {
        var candidates = new List<SolverCandidate>(scenario.Candidates);

        for (var i = 0; i < scenario.Candidates; i++)
        {
            var institution = Guid.Parse($"00000000-0000-0000-0000-{i % scenario.Institutions:D12}");
            candidates.Add(new SolverCandidate(Guid.NewGuid(), institution, $"R{i + 1:D4}", "General"));
        }

        var blocked = Enumerable.Range(0, scenario.BlockedSeats)
            .Select(i => (i / scenario.Columns, i % scenario.Columns))
            .ToArray();

        var halls = new List<SolverHall> { new(Guid.NewGuid(), "A", scenario.Rows, scenario.Columns, blocked) };

        var input = new SolverInput(candidates, halls, new(), strategy, 42, TimeSpan.FromSeconds(10));

        try
        {
            return (input, _solver.Solve(input));
        }
        catch (SeatCraft.Domain.Common.DomainException)
        {
            return (input, null);
        }
    }
}

public sealed record GridScenario(int Rows, int Columns, int Candidates, int Institutions, int BlockedSeats);
