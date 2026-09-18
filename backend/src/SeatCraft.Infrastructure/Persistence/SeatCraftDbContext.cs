using Microsoft.EntityFrameworkCore;
using SeatCraft.Domain.Common;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Infrastructure.Persistence;

public sealed class SeatCraftDbContext(DbContextOptions<SeatCraftDbContext> options, TenantContext? tenantContext = null)
    : DbContext(options)
{
    private Guid? CurrentTenantId => tenantContext?.TenantId;

    public DbSet<Tenant> Tenants => Set<Tenant>();

    public DbSet<AppUser> Users => Set<AppUser>();

    public DbSet<Exam> Exams => Set<Exam>();

    public DbSet<Hall> Halls => Set<Hall>();

    public DbSet<Institution> Institutions => Set<Institution>();

    public DbSet<Candidate> Candidates => Set<Candidate>();

    public DbSet<SeatPlan> SeatPlans => Set<SeatPlan>();

    public DbSet<AllocationRun> AllocationRuns => Set<AllocationRun>();

    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SeatCraftDbContext).Assembly);

        ApplyTenantFilters(modelBuilder);
        ApplyTimestampConversion(modelBuilder);

        base.OnModelCreating(modelBuilder);
    }

    /// <summary>Maps every DateTimeOffset to UTC ticks so SQLite can sort and filter.</summary>
    private static void ApplyTimestampConversion(ModelBuilder modelBuilder)
    {
        var converter = new UtcDateTimeOffsetConverter();

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset))
                    property.SetValueConverter(converter);
                else if (property.ClrType == typeof(DateTimeOffset?))
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTimeOffset?, long?>(
                        value => value == null ? null : value.Value.UtcTicks,
                        value => value == null ? null : new DateTimeOffset(value.Value, TimeSpan.Zero)));
            }
        }
    }

    /// <summary>
    /// Every tenant-owned entity is filtered automatically. An unresolved tenant sees
    /// nothing, which fails closed rather than leaking data.
    /// </summary>
    private void ApplyTenantFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(TenantEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "entity");
            var tenantProperty = System.Linq.Expressions.Expression.Property(parameter, nameof(TenantEntity.TenantId));
            var nullableTenantProperty = System.Linq.Expressions.Expression.Convert(tenantProperty, typeof(Guid?));
            var currentTenant = System.Linq.Expressions.Expression.Property(
                System.Linq.Expressions.Expression.Constant(this),
                nameof(CurrentTenantId));

            var filter = System.Linq.Expressions.Expression.Lambda(
                System.Linq.Expressions.Expression.Equal(nullableTenantProperty, currentTenant),
                parameter);

            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
