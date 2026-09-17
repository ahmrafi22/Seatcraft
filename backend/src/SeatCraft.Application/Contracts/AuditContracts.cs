namespace SeatCraft.Application.Contracts;

public sealed record AuditEntryDto(
    Guid Id,
    string Action,
    string Detail,
    bool IsForced,
    string? Reason,
    Guid? ActorUserId,
    DateTimeOffset CreatedAt);
