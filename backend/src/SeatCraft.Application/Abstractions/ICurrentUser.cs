namespace SeatCraft.Application.Abstractions;

public interface ICurrentUser
{
    Guid? UserId { get; }

    Guid? TenantId { get; }

    string? Email { get; }

    string? Role { get; }

    bool IsAdmin { get; }

    bool IsAuthenticated { get; }

    /// <summary>Throws when the caller is not authenticated or has no tenant.</summary>
    Guid RequireTenantId();

    Guid RequireUserId();
}
