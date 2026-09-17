using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;

namespace SeatCraft.Domain.Tests.Solver;

/// <summary>
/// Scenarios where a naive first-fit placement cannot satisfy the adjacency rule,
/// proving the strategies are not interchangeable.
/// </summary>
public class StrategyComparisonTests
{
    private readonly SeatAllocationSolver _solver = new();

    private static (List<SolverCandidate> Candidates, List<SolverHall> Halls) TwoInstitutions(int perInstitution, int rows, int columns)
    {
        var institutionA = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var institutionB = Guid.Parse("00000000-0000-0000-0000-000000000002");

        var candidates = new List<SolverCandidate>();

        for (var i = 0; i < perInstitution; i++)
        {
            candidates.Add(Scenario.Candidate(institutionA, $"A{i + 1:D3}"));
            candidates.Add(Scenario.Candidate(institutionB, $"B{i + 1:D3}"));
        }

        return (candidates, [Scenario.Hall("A", rows, columns)]);
    }

    [Fact]
    public void Strict_FindsCleanLayout_WhereNaiveFirstFitConflicts()
    {
        var (candidates, halls) = TwoInstitutions(perInstitution: 4, rows: 2, columns: 4);

        var greedy = _solver.Solve(Scenario.Input(candidates, halls, AllocationStrategyKind.Greedy));
        var strict = _solver.Solve(Scenario.Input(candidates, halls, AllocationStrategyKind.Strict));

        Assert.NotEmpty(greedy.Violations);
        Assert.Empty(strict.Violations);
        Assert.True(strict.IsOptimal);
    }

    [Fact]
    public void Strict_NeverWorseThanBalanced()
    {
        var (candidates, halls) = TwoInstitutions(perInstitution: 4, rows: 2, columns: 4);

        var balanced = _solver.Solve(Scenario.Input(candidates, halls, AllocationStrategyKind.Balanced));
        var strict = _solver.Solve(Scenario.Input(candidates, halls, AllocationStrategyKind.Strict));

        Assert.True(strict.Violations.Count <= balanced.Violations.Count);
    }

    [Fact]
    public void AllStrategies_AssignEveryCandidate()
    {
        var (candidates, halls) = TwoInstitutions(perInstitution: 4, rows: 2, columns: 4);

        foreach (var strategy in Enum.GetValues<AllocationStrategyKind>())
        {
            var result = _solver.Solve(Scenario.Input(candidates, halls, strategy));

            Assert.Equal(candidates.Count, result.Placements.Count);
        }
    }
}
