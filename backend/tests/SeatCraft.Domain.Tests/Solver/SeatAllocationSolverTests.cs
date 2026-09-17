using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;

namespace SeatCraft.Domain.Tests.Solver;

public class SeatAllocationSolverTests
{
    private readonly SeatAllocationSolver _solver = new();

    [Fact]
    public void Solve_AssignsEveryCandidateExactlyOnce()
    {
        var input = Scenario.Input(Scenario.Candidates(120, 12), [Scenario.Hall("A", 8, 10), Scenario.Hall("B", 8, 10)]);

        var result = _solver.Solve(input);

        Assert.Equal(120, result.Placements.Count);
        Assert.Equal(120, result.Placements.Select(p => p.CandidateId).Distinct().Count());
    }

    [Fact]
    public void Solve_NeverAssignsTwoCandidatesToOneSeat()
    {
        var input = Scenario.Input(Scenario.Candidates(200, 20), [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10)]);

        var result = _solver.Solve(input);

        var distinctSeats = result.Placements.Select(p => (p.HallId, p.Row, p.Column)).Distinct().Count();

        Assert.Equal(result.Placements.Count, distinctSeats);
    }

    [Fact]
    public void Solve_StrictStrategy_ProducesNoAdjacentSameInstitutionViolations()
    {
        var input = Scenario.Input(
            Scenario.Candidates(300, 30),
            [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10), Scenario.Hall("C", 10, 10)]);

        var result = _solver.Solve(input);

        Assert.DoesNotContain(result.Violations, v => v.Kind == ViolationKind.SameInstitutionAdjacent);
        Assert.Empty(result.Violations);
    }

    [Fact]
    public void Solve_Throws_WhenSeatsAreInsufficient()
    {
        var input = Scenario.Input(Scenario.Candidates(10, 2), [Scenario.Hall("A", 2, 2)]);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() => _solver.Solve(input));

        Assert.Contains("Not enough usable seats", error.Message);
    }

    [Fact]
    public void Solve_Throws_WhenSingleInstitutionExceedsIndependentSet()
    {
        var candidates = Scenario.Candidates(6, 1);
        var input = Scenario.Input(candidates, [Scenario.Hall("A", 2, 4)]);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() => _solver.Solve(input));

        Assert.Contains("without two sitting side by side", error.Message);
    }

    [Fact]
    public void Solve_Throws_OnDuplicateRolls()
    {
        var candidates = Scenario.Candidates(4, 2).ToList();
        candidates[1] = candidates[1] with { Roll = candidates[0].Roll };

        var input = Scenario.Input(candidates, [Scenario.Hall("A", 2, 2)]);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() => _solver.Solve(input));

        Assert.Contains("Duplicate roll numbers", error.Message);
    }

    [Fact]
    public void Solve_ReportsProgress()
    {
        var progress = new RecordingProgress<SolverProgress>();

        var input = Scenario.Input(Scenario.Candidates(300, 30), [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10), Scenario.Hall("C", 10, 10)]);
        _solver.Solve(input, progress);

        Assert.NotEmpty(progress.Reports);
        Assert.Contains(progress.Reports, report => report.Percent > 0);
    }

    [Fact]
    public void Solve_IsDeterministic_ForSameInput()
    {
        var candidates = Scenario.Candidates(150, 15);
        var halls = new[] { Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10) };

        var first = _solver.Solve(Scenario.Input(candidates, halls));
        var second = _solver.Solve(Scenario.Input(candidates, halls));

        Assert.Equal(
            first.Placements.OrderBy(p => p.CandidateId).Select(p => (p.HallId, p.Row, p.Column)),
            second.Placements.OrderBy(p => p.CandidateId).Select(p => (p.HallId, p.Row, p.Column)));
    }

    [Fact]
    public void Solve_Greedy_IsFasterButMayConflict()
    {
        var input = Scenario.Input(
            Scenario.Candidates(400, 8),
            [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10), Scenario.Hall("C", 10, 10), Scenario.Hall("D", 10, 10)],
            AllocationStrategyKind.Greedy);

        var result = _solver.Solve(input);

        Assert.Equal(400, result.Placements.Count);
    }

    [Fact]
    public void Solve_HonoursExternalCancellation()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var input = Scenario.Input(
            Scenario.Candidates(500, 5),
            [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10), Scenario.Hall("C", 10, 10), Scenario.Hall("D", 10, 10), Scenario.Hall("E", 10, 10)],
            AllocationStrategyKind.Strict);

        Assert.Throws<OperationCanceledException>(() => _solver.Solve(input, cancellationToken: cts.Token));
    }

    [Fact]
    public void Solve_ReportsCompletedWithinTimeLimit()
    {
        var input = Scenario.Input(
            Scenario.Candidates(200, 10),
            [Scenario.Hall("A", 10, 10), Scenario.Hall("B", 10, 10)],
            AllocationStrategyKind.Strict,
            timeLimit: TimeSpan.FromSeconds(30));

        var result = _solver.Solve(input);

        Assert.True(result.CompletedWithinTimeLimit);
    }
}
