using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;

namespace SeatCraft.Domain.Tests.Solver;

public class SeatGridTests
{
    [Fact]
    public void Build_SkipsBlockedSeats()
    {
        var hall = Scenario.Hall("A", 2, 3, (0, 1));

        var grid = SeatGrid.Build([hall]);

        Assert.Equal(5, grid.Count);
    }

    [Fact]
    public void NeighborsOf_InteriorSeat_HasFourNeighbors()
    {
        var hall = Scenario.Hall("A", 3, 3);

        var grid = SeatGrid.Build([hall]);
        var center = grid.Slots.Single(s => s.Row == 1 && s.Column == 1);

        Assert.Equal(4, grid.NeighborsOf(center.Index).Count);
    }

    [Fact]
    public void NeighborsOf_CornerSeat_HasTwoNeighbors()
    {
        var hall = Scenario.Hall("A", 3, 3);

        var grid = SeatGrid.Build([hall]);
        var corner = grid.Slots.Single(s => s.Row == 0 && s.Column == 0);

        Assert.Equal(2, grid.NeighborsOf(corner.Index).Count);
    }

    [Fact]
    public void NeighborsOf_BlockedSeatRemoved_DoesNotBridgeGap()
    {
        var hall = Scenario.Hall("A", 1, 3, (0, 1));

        var grid = SeatGrid.Build([hall]);
        var left = grid.Slots.Single(s => s.Column == 0);

        Assert.Empty(grid.NeighborsOf(left.Index));
    }

    [Fact]
    public void Build_MultipleHalls_DoesNotCrossHallNeighbors()
    {
        var grid = SeatGrid.Build([Scenario.Hall("A", 2, 2), Scenario.Hall("B", 2, 2)]);

        Assert.Equal(8, grid.Count);

        foreach (var slot in grid.Slots)
        {
            foreach (var neighbor in grid.NeighborsOf(slot.Index))
                Assert.Equal(slot.HallId, grid.Slots[neighbor].HallId);
        }
    }

    [Fact]
    public void Solve_Strategy_IsRegistered()
    {
        var input = Scenario.Input(Scenario.Candidates(4, 2), [Scenario.Hall("A", 2, 2)]);

        var result = new SeatAllocationSolver().Solve(input);

        Assert.Equal(4, result.Placements.Count);
    }
}
