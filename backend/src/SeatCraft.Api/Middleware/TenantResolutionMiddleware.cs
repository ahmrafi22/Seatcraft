using System.Security.Claims;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Api.Middleware;

/// <summary>
/// Copies the tenant claim into the scoped <see cref="TenantContext"/> so EF query
/// filters apply. Runs after authentication and before any handler touches the DB.
/// </summary>
public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TenantContext tenantContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var claim = context.User.FindFirstValue("tenant_id");

            if (Guid.TryParse(claim, out var tenantId))
                tenantContext.Set(tenantId);
        }

        await next(context);
    }
}
