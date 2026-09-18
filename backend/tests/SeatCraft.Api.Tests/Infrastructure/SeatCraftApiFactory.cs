using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Api.Tests.Infrastructure;

/// <summary>
/// Boots the real API against a throwaway SQLite file so each test class gets an
/// isolated database without needing Docker.
/// </summary>
public sealed class SeatCraftApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"seatcraft-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.UseSetting("Database:Provider", "Sqlite");
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={_databasePath}");
        builder.UseSetting("Jwt:SigningKey", "integration-test-signing-key-that-is-long-enough");
        builder.UseSetting("EnableSwagger", "false");
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();

        if (File.Exists(_databasePath))
        {
            try
            {
                File.Delete(_databasePath);
            }
            catch (IOException)
            {
                // SQLite still holds the handle on some platforms; the temp file is disposable.
            }
        }
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SeatCraftDbContext>();

        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();
    }
}
