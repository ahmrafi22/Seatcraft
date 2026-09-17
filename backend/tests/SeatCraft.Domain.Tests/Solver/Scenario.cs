using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Domain.Tests.Solver;

/// <summary>Shared builders so tests describe scenarios, not object graphs.</summary>
public static class Scenario
{
    public static SolverHall Hall(string name, int rows, int columns, params (int Row, int Column)[] blocked) =>
        new(Guid.NewGuid(), name, rows, columns, blocked);

    public static SolverCandidate Candidate(Guid institutionId, string roll, string subjectGroup = "General") =>
        new(Guid.NewGuid(), institutionId, roll, subjectGroup);

    /// <summary>Evenly distributes candidates across institutions in round-robin order.</summary>
    public static List<SolverCandidate> Candidates(int count, int institutionCount, int institutionOffset = 0)
    {
        var candidates = new List<SolverCandidate>(count);

        for (var i = 0; i < count; i++)
        {
            var institution = Guid.Parse($"00000000-0000-0000-0000-{institutionOffset + (i % institutionCount):D12}");
            candidates.Add(Candidate(institution, $"R{i + 1:D5}"));
        }

        return candidates;
    }

    public static SolverInput Input(
        IReadOnlyList<SolverCandidate> candidates,
        IReadOnlyList<SolverHall> halls,
        AllocationStrategyKind strategy = AllocationStrategyKind.Strict,
        AllocationConstraints? constraints = null,
        TimeSpan? timeLimit = null) =>
        new(candidates, halls, constraints ?? AllocationConstraints.Default, strategy, 42, timeLimit ?? TimeSpan.FromSeconds(30));
}
