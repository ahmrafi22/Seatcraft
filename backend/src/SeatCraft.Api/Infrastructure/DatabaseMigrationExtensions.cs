using Microsoft.EntityFrameworkCore;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Api.Infrastructure;

public static class DatabaseMigrationExtensions
{
    /// <summary>Applies pending migrations at startup so a fresh clone runs without manual steps.</summary>
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SeatCraftDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Database migration failed");
            throw;
        }
    }
}
