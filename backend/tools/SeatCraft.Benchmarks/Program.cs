using System.Diagnostics;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;
using SeatCraft.Domain.ValueObjects;

var scenarios = new (string Name, int Candidates, int Halls, int Institutions, int Rows, int Columns)[]
{
    ("Easy", 500, 6, 20, 10, 10),
    ("Typical", 2000, 18, 60, 12, 12),
    ("Large", 5000, 40, 120, 14, 14),
    ("Tight", 1000, 10, 2, 10, 10),
    ("Dense", 2900, 15, 3, 14, 14)
};

var strategies = new[] { AllocationStrategyKind.Greedy, AllocationStrategyKind.Balanced, AllocationStrategyKind.Strict };
var solver = new SeatAllocationSolver();

Console.WriteLine("| Scenario | Candidates | Halls | Institutions | Strategy | Time (ms) | Violations | Halls used | Optimal |");
Console.WriteLine("|---|---|---|---|---|---|---|---|---|");

foreach (var scenario in scenarios)
{
    var candidates = BuildCandidates(scenario.Candidates, scenario.Institutions);
    var halls = BuildHalls(scenario.Halls, scenario.Rows, scenario.Columns);

    foreach (var strategy in strategies)
    {
        var input = new SolverInput(
            candidates,
            halls,
            AllocationConstraints.Default,
            strategy,
            Seed: 42,
            TimeLimit: TimeSpan.FromSeconds(60));

        SolverResult result;

        try
        {
            result = solver.Solve(input);
        }
        catch (SeatCraft.Domain.Common.DomainException exception)
        {
            Console.WriteLine($"| {scenario.Name} | {scenario.Candidates} | {scenario.Halls} | {scenario.Institutions} | {strategy} | n/a | infeasible | n/a | n/a |");
            Console.Error.WriteLine($"{scenario.Name}/{strategy}: {exception.Message}");
            continue;
        }

        Console.WriteLine(
            $"| {scenario.Name} | {scenario.Candidates} | {scenario.Halls} | {scenario.Institutions} | {strategy} " +
            $"| {result.Metrics.DurationMs} | {result.Violations.Count} | {result.Metrics.HallsUsed} | {result.IsOptimal} |");
    }
}

Console.WriteLine();
Console.WriteLine("Legend: Violations counts same-institution adjacency and roll-order issues.");

static List<SolverCandidate> BuildCandidates(int count, int institutions)
{
    var candidates = new List<SolverCandidate>(count);

    for (var i = 0; i < count; i++)
    {
        var institutionId = Guid.Parse($"00000000-0000-0000-0000-{i % institutions:D12}");
        candidates.Add(new SolverCandidate(Guid.NewGuid(), institutionId, $"R{i + 1:D5}", "General"));
    }

    return candidates;
}

static List<SolverHall> BuildHalls(int count, int rows, int columns)
{
    var halls = new List<SolverHall>(count);

    for (var i = 0; i < count; i++)
        halls.Add(new SolverHall(Guid.NewGuid(), $"H{i + 1}", rows, columns));

    return halls;
}
