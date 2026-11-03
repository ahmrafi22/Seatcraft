using SeatCraft.Domain.Common;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Domain.Entities;

public sealed class Exam : TenantEntity
{
    private Exam() { }

    public static Exam Create(Guid tenantId, string title, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new DomainException("Exam title is required.");

        return new Exam
        {
            TenantId = tenantId,
            Title = title.Trim(),
            Description = description?.Trim(),
            Status = ExamStatus.Draft
        };
    }

    public string Title { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    /// <summary>
    /// The day the exam is actually sat. Optional — an exam is often created before
    /// its date is fixed — but admit cards need it, so they fall back to a placeholder
    /// rather than printing the creation timestamp as if it were the exam date.
    /// </summary>
    public DateOnly? ExamDate { get; private set; }

    public ExamStatus Status { get; private set; }

    public AllocationConstraints Constraints { get; private set; } = AllocationConstraints.Default;

    public Guid? ActiveSeatPlanId { get; private set; }

    public void Rename(string title, string? description)
    {
        Title = string.IsNullOrWhiteSpace(title)
            ? throw new DomainException("Exam title is required.")
            : title.Trim();
        Description = description?.Trim();
        Touch();
    }

    public void UpdateConstraints(AllocationConstraints constraints)
    {
        EnsureEditable();
        Constraints = constraints;
        Status = ExamStatus.Configured;
        Touch();
    }

    /// <summary>Sets or clears the scheduled exam date. Only while the exam is editable.</summary>
    public void Schedule(DateOnly? examDate)
    {
        EnsureEditable();
        ExamDate = examDate;
        Touch();
    }

    public void MarkAllocated(Guid seatPlanId)
    {
        ActiveSeatPlanId = seatPlanId;
        Status = ExamStatus.Allocated;
        Touch();
    }

    public void MarkPublished(Guid seatPlanId)
    {
        ActiveSeatPlanId = seatPlanId;
        Status = ExamStatus.Published;
        Touch();
    }

    public void Archive()
    {
        Status = ExamStatus.Archived;
        Touch();
    }

    private void EnsureEditable()
    {
        if (Status is ExamStatus.Published or ExamStatus.Archived)
            throw new DomainException($"Exam cannot be modified while {Status}.");
    }
}
