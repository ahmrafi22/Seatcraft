using SeatCraft.Domain.Entities;

namespace SeatCraft.Domain.Tests.Entities;

public class SeatPlanTests
{
    private static SeatPlan PlanWithThreeAssignments(out Guid hallId, out List<Guid> candidateIds)
    {
        hallId = Guid.NewGuid();
        candidateIds = [Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()];

        var plan = SeatPlan.CreateDraft(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        plan.AddAssignment(candidateIds[0], hallId, 0, 0);
        plan.AddAssignment(candidateIds[1], hallId, 0, 1);
        plan.AddAssignment(candidateIds[2], hallId, 1, 0);

        return plan;
    }

    [Fact]
    public void ReplaceAssignments_MovesSeatsInPlace_KeepingIdentity()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out var candidateIds);
        var originalIds = plan.Assignments.ToDictionary(a => a.CandidateId, a => a.Id);

        plan.ReplaceAssignments(
        [
            (candidateIds[0], hallId, 5, 5),
            (candidateIds[1], hallId, 0, 1),
            (candidateIds[2], hallId, 1, 0)
        ]);

        var moved = plan.Assignments.Single(a => a.CandidateId == candidateIds[0]);

        Assert.Equal((5, 5), (moved.Row, moved.Column));

        // Identity must be preserved, otherwise EF tries to update rows that no longer exist.
        foreach (var assignment in plan.Assignments)
            Assert.Equal(originalIds[assignment.CandidateId], assignment.Id);
    }

    [Fact]
    public void ReplaceAssignments_SwappingTwoCandidates_KeepsBothIdentities()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out var candidateIds);
        var first = plan.Assignments.Single(a => a.CandidateId == candidateIds[0]);
        var second = plan.Assignments.Single(a => a.CandidateId == candidateIds[1]);

        plan.ReplaceAssignments(
        [
            (candidateIds[0], hallId, second.Row, second.Column),
            (candidateIds[1], hallId, first.Row, first.Column),
            (candidateIds[2], hallId, 1, 0)
        ]);

        Assert.Equal((0, 1), (plan.Assignments.Single(a => a.CandidateId == candidateIds[0]).Row,
                              plan.Assignments.Single(a => a.CandidateId == candidateIds[0]).Column));

        Assert.Equal(3, plan.Assignments.Count);
    }

    [Fact]
    public void ReplaceAssignments_RejectsDuplicateSeats()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out var candidateIds);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() =>
            plan.ReplaceAssignments(
            [
                (candidateIds[0], hallId, 3, 3),
                (candidateIds[1], hallId, 3, 3),
                (candidateIds[2], hallId, 1, 0)
            ]));

        Assert.Contains("assigned twice", error.Message);
    }

    [Fact]
    public void AddAssignment_RejectsDuplicateSeat()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out _);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() =>
            plan.AddAssignment(Guid.NewGuid(), hallId, 0, 0));

        Assert.Contains("already taken", error.Message);
    }

    [Fact]
    public void AddAssignment_RejectsSameCandidateTwice()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out var candidateIds);

        var error = Assert.Throws<SeatCraft.Domain.Common.DomainException>(() =>
            plan.AddAssignment(candidateIds[0], hallId, 9, 9));

        Assert.Contains("already has a seat", error.Message);
    }

    [Fact]
    public void Publish_RequiresAssignments()
    {
        var plan = SeatPlan.CreateDraft(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Assert.Throws<SeatCraft.Domain.Common.DomainException>(() => plan.Publish());
    }

    [Fact]
    public void PublishedPlan_CannotBeRebuilt()
    {
        var plan = PlanWithThreeAssignments(out var hallId, out var candidateIds);
        plan.Publish();

        Assert.Throws<SeatCraft.Domain.Common.DomainException>(() =>
            plan.ReplaceAssignments([(candidateIds[0], hallId, 7, 7), (candidateIds[1], hallId, 0, 1), (candidateIds[2], hallId, 1, 0)]));
    }
}
