using System.Security.Claims;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;

namespace SeatCraft.Api.Infrastructure;

public sealed class HttpCurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public Guid? UserId =>
        Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public Guid? TenantId =>
        Guid.TryParse(Principal?.FindFirstValue("tenant_id"), out var id) ? id : null;

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);

    public bool IsAdmin => string.Equals(Role, "Admin", StringComparison.OrdinalIgnoreCase);

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid RequireTenantId() =>
        TenantId ?? throw new ForbiddenException("The current user has no tenant context.");

    public Guid RequireUserId() =>
        UserId ?? throw new ForbiddenException("The current user is not authenticated.");
}
