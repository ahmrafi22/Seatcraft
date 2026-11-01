using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Allocation;
using SeatCraft.Application.Auth;
using SeatCraft.Application.Candidates;
using SeatCraft.Application.Exams;
using SeatCraft.Application.Halls;
using SeatCraft.Application.Institutions;
using SeatCraft.Application.Seed;
using SeatCraft.Infrastructure.BackgroundJobs;
using SeatCraft.Infrastructure.Caching;
using SeatCraft.Infrastructure.Concurrency;
using SeatCraft.Infrastructure.Pdf;
using SeatCraft.Infrastructure.Persistence;
using SeatCraft.Infrastructure.Security;
using StackExchange.Redis;

namespace SeatCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddPersistence(configuration);
        services.AddSecurity(configuration);
        services.AddApplicationServices();
        services.AddCachingAndQueue(configuration);
        services.AddPdf();

        return services;
    }

    private static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var providerName = configuration["Database:Provider"] ?? "Sqlite";
        var connectionString = configuration.GetConnectionString("Default")
            ?? "Data Source=seatcraft.db";
        var isPostgres = providerName.StartsWith("Postgres", StringComparison.OrdinalIgnoreCase);

        services.AddScoped<TenantContext>();

        services.AddDbContext<SeatCraftDbContext>((serviceProvider, options) =>
        {
            if (isPostgres)
            {
                options.UseNpgsql(connectionString, npgsql =>
                    npgsql.EnableRetryOnFailure(maxRetryCount: 3));

                // Migrations are generated against SQLite, so the snapshot keeps SQLite
                // annotations and can never match a Postgres model. The migration
                // operations themselves are provider-agnostic, so the warning is noise.
                options.ConfigureWarnings(warnings =>
                    warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            }
            else
            {
                options.UseSqlite(connectionString);
            }

            options.EnableSensitiveDataLogging(false);
        });

        services.AddScoped<ISeatCraftData, SeatCraftData>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }

    private static IServiceCollection AddSecurity(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<ITokenIssuer, JwtTokenIssuer>();

        return services;
    }

    private static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<ExamService>();
        services.AddScoped<HallService>();
        services.AddScoped<InstitutionService>();
        services.AddScoped<CandidateService>();
        services.AddScoped<CandidateImportService>();
        services.AddScoped<AllocationService>();
        services.AddScoped<AllocationRunner>();
        services.AddScoped<SeatPlanService>();
        services.AddScoped<DemoSeedService>();

        return services;
    }

    private static IServiceCollection AddCachingAndQueue(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConnection = configuration.GetConnectionString("Redis");

        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            services.AddStackExchangeRedisCache(options => options.Configuration = redisConnection);
            services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConnection));
            services.AddSingleton<IPlanCache, DistributedPlanCache>();
            services.AddSingleton<IDistributedLock, RedisDistributedLock>();
        }
        else
        {
            services.AddMemoryCache();
            services.AddSingleton<IPlanCache, InMemoryPlanCache>();
            services.AddSingleton<IDistributedLock, InMemoryDistributedLock>();
        }

        services.AddSingleton<IAllocationQueue, InMemoryAllocationQueue>();
        services.AddHostedService<AllocationWorker>();

        return services;
    }

    private static IServiceCollection AddPdf(this IServiceCollection services)
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

        services.AddSingleton<IAdmitCardGenerator, QuestPdfAdmitCardGenerator>();
        services.AddSingleton<IAttendanceSheetGenerator, QuestPdfAttendanceSheetGenerator>();

        return services;
    }
}
