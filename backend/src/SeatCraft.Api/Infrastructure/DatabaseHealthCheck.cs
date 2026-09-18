using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Api.Infrastructure;

/// <summary>Readiness probe: reports unhealthy when the database cannot be reached.</summary>
public sealed class DatabaseHealthCheck(SeatCraftDbContext database) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await database.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("Database reachable.")
                : HealthCheckResult.Unhealthy("Database is not reachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("Database check failed.", exception);
        }
    }
}
