using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;

namespace SeatCraft.Domain.Tests.Solver;

public class PlanValidatorTests
{
    private static (SeatGrid Grid, IReadOnlyList<SolverCandidate> Candidates) Checkerboard()
    {
        var grid = SeatGrid.Build([Scenario.Hall("A", 2, 2)]);
        var institutionA = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var institutionB = Guid.Parse("00000000-0000-0000-0000-000000000002");

        var candidates = new List<SolverCandidate>
        {
            Scenario.Candidate(institutionA, "R1"),
            Scenario.Candidate(institutionA, "R2"),
            Scenario.Candidate(institutionB, "R3"),
            Scenario.Candidate(institutionB, "R4")
        };

        return (grid, candidates);
    }

    [Fact]
    public void Validate_CheckerboardLayout_HasNoViolations()
    {
        var (grid, candidates) = Checkerboard();
        var hall = grid.Slots[0].HallId;

        var placements = new List<SeatPlacement>
        {
            new(candidates[0].Id, hall, 0, 0),
            new(candidates[2].Id, hall, 0, 1),
            new(candidates[3].Id, hall, 1, 0),
            new(candidates[1].Id, hall, 1, 1)
        };

        var violations = PlanValidator.Validate(candidates, placements, grid, new());

        Assert.DoesNotContain(violations, v => v.Kind == ViolationKind.SameInstitutionAdjacent);
    }

    [Fact]
    public void Validate_AdjacentSameInstitution_IsReported()
    {
        var (grid, candidates) = Checkerboard();
        var hall = grid.Slots[0].HallId;

        var placements = new List<SeatPlacement>
        {
            new(candidates[0].Id, hall, 0, 0),
            new(candidates[1].Id, hall, 0, 1),
            new(candidates[2].Id, hall, 1, 0),
            new(candidates[3].Id, hall, 1, 1)
        };

        var violations = PlanValidator.Validate(candidates, placements, grid, new());

        Assert.Contains(violations, v => v.Kind == ViolationKind.SameInstitutionAdjacent);
    }

    [Fact]
    public void Validate_DuplicateSeat_IsReported()
    {
        var (grid, candidates) = Checkerboard();
        var hall = grid.Slots[0].HallId;

        var placements = new List<SeatPlacement>
        {
            new(candidates[0].Id, hall, 0, 0),
            new(candidates[1].Id, hall, 0, 0)
        };

        var violations = PlanValidator.Validate(candidates, placements, grid, new());

        Assert.Contains(violations, v => v.Message.Contains("more than one candidate"));
    }

    [Fact]
    public void Validate_BlockedSeat_IsReported()
    {
        var grid = SeatGrid.Build([Scenario.Hall("A", 2, 2, (0, 1))]);
        var hall = grid.Slots[0].HallId;

        var candidates = new List<SolverCandidate> { Scenario.Candidate(Guid.NewGuid(), "R1") };
        var placements = new List<SeatPlacement> { new(candidates[0].Id, hall, 0, 1) };

        var violations = PlanValidator.Validate(candidates, placements, grid, new());

        Assert.Contains(violations, v => v.Message.Contains("not a usable seat"));
    }
}
