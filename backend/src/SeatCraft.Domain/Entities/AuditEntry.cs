using SeatCraft.Domain.Common;

namespace SeatCraft.Domain.Entities;

public sealed class AuditEntry : TenantEntity
{
    private AuditEntry() { }

    public static AuditEntry Record(
        Guid tenantId,
        Guid examId,
        Guid? actorUserId,
        string action,
        string detail,
        bool isForced = false,
        string? reason = null)
    {
        return new AuditEntry
        {
            TenantId = tenantId,
            ExamId = examId,
            ActorUserId = actorUserId,
            Action = action,
            Detail = detail,
            IsForced = isForced,
            Reason = reason
        };
    }

    public Guid ExamId { get; private set; }

    public Guid? ActorUserId { get; private set; }

    public string Action { get; private set; } = string.Empty;

    public string Detail { get; private set; } = string.Empty;

    public bool IsForced { get; private set; }

    public string? Reason { get; private set; }
}
