using SeatCraft.Domain.Common;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Domain.Entities;

public sealed class SeatPlan : TenantEntity
{
    private readonly List<SeatAssignment> _assignments = [];

    private SeatPlan() { }

    public static SeatPlan CreateDraft(Guid tenantId, Guid examId, Guid allocationRunId)
    {
        return new SeatPlan
        {
            TenantId = tenantId,
            ExamId = examId,
            AllocationRunId = allocationRunId,
            Status = SeatPlanStatus.Draft
        };
    }

    public Guid ExamId { get; private set; }

    public Guid AllocationRunId { get; private set; }

    public SeatPlanStatus Status { get; private set; }

    public int ViolationCount { get; private set; }

    public DateTimeOffset? PublishedAt { get; private set; }

    public IReadOnlyCollection<SeatAssignment> Assignments => _assignments;

    public void AddAssignment(Guid candidateId, Guid hallId, int row, int column)
    {
        if (_assignments.Any(a => a.CandidateId == candidateId))
            throw new DomainException("Candidate already has a seat in this plan.");

        if (_assignments.Any(a => a.HallId == hallId && a.Row == row && a.Column == column))
            throw new DomainException($"Seat {new SeatPosition(hallId, row, column).Label} is already taken.");

        _assignments.Add(new SeatAssignment(Id, candidateId, hallId, row, column));
    }

    /// <summary>
    /// Applies new seat positions in place. Mutating the existing assignments rather
    /// than clearing and re-adding keeps their identities stable, so EF emits UPDATEs
    /// instead of trying to modify rows it no longer owns.
    /// </summary>
    public void ReplaceAssignments(IEnumerable<(Guid CandidateId, Guid HallId, int Row, int Column)> assignments)
    {
        if (Status == SeatPlanStatus.Published)
            throw new DomainException("A published plan cannot be rebuilt.");

        var incoming = assignments.ToList();
        var incomingByCandidate = incoming.ToDictionary(entry => entry.CandidateId);
        var currentByCandidate = _assignments.ToDictionary(assignment => assignment.CandidateId);

        foreach (var assignment in _assignments)
        {
            if (!incomingByCandidate.TryGetValue(assignment.CandidateId, out var target))
                throw new DomainException("An override must keep every candidate in the plan.");

            assignment.MoveTo(target.HallId, target.Row, target.Column);
        }

        foreach (var entry in incoming)
        {
            if (!currentByCandidate.ContainsKey(entry.CandidateId))
                _assignments.Add(new SeatAssignment(Id, entry.CandidateId, entry.HallId, entry.Row, entry.Column));
        }

        EnsureNoDuplicateSeats();
        Touch();
    }

    private void EnsureNoDuplicateSeats()
    {
        var duplicate = _assignments
            .GroupBy(assignment => (assignment.HallId, assignment.Row, assignment.Column))
            .FirstOrDefault(group => group.Count() > 1);

        if (duplicate is not null)
            throw new DomainException($"Seat {duplicate.First().Label} would be assigned twice.");
    }

    public void SetViolationCount(int count)
    {
        if (count < 0)
            throw new DomainException("Violation count cannot be negative.");

        ViolationCount = count;
        Touch();
    }

    public void Publish()
    {
        if (Status == SeatPlanStatus.Published)
            throw new DomainException("Plan is already published.");

        if (_assignments.Count == 0)
            throw new DomainException("Cannot publish an empty plan.");

        Status = SeatPlanStatus.Published;
        PublishedAt = DateTimeOffset.UtcNow;
        Touch();
    }

    public void Supersede()
    {
        Status = SeatPlanStatus.Superseded;
        Touch();
    }
}
