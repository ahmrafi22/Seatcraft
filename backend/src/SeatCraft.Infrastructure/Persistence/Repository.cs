using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Domain.Common;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Infrastructure.Persistence;

public sealed class Repository<T>(SeatCraftDbContext context) : IRepository<T> where T : class
{
    public Task<T?> FindAsync(Guid id, CancellationToken cancellationToken = default) =>
        context.Set<T>().FindAsync([id], cancellationToken).AsTask();

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await context.Set<T>().AddAsync(entity, cancellationToken);

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default) =>
        await context.Set<T>().AddRangeAsync(entities, cancellationToken);

    public void Remove(T entity) => context.Set<T>().Remove(entity);

    public void RemoveRange(IEnumerable<T> entities) => context.Set<T>().RemoveRange(entities);

    public IQueryable<T> Query() => context.Set<T>().AsQueryable();

    public IQueryable<T> QueryUnfiltered() => context.Set<T>().IgnoreQueryFilters();
}

public sealed class UnitOfWork(SeatCraftDbContext context) : IUnitOfWork
{
    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            throw new UniqueConstraintViolationException("A unique constraint rejected the write.", exception);
        }
    }

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await action(cancellationToken);
            await SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception)
    {
        for (var current = exception.InnerException; current is not null; current = current.InnerException)
        {
            if (current is Microsoft.Data.Sqlite.SqliteException { SqliteErrorCode: 19 })
                return true;

            if (current.GetType().Name == "PostgresException")
                return true;
        }

        return false;
    }
}

/// <summary>Bundles the repositories behind one interface so services take a single dependency.</summary>
public sealed class SeatCraftData(SeatCraftDbContext context) : ISeatCraftData
{
    private IRepository<Exam>? _exams;
    private IRepository<Hall>? _halls;
    private IRepository<Candidate>? _candidates;
    private IRepository<Institution>? _institutions;
    private IRepository<SeatPlan>? _seatPlans;
    private IRepository<AllocationRun>? _allocationRuns;
    private IRepository<AuditEntry>? _auditEntries;
    private IRepository<AppUser>? _users;
    private IRepository<Tenant>? _tenants;

    public IRepository<Exam> Exams => _exams ??= new Repository<Exam>(context);

    public IRepository<Hall> Halls => _halls ??= new Repository<Hall>(context);

    public IRepository<Candidate> Candidates => _candidates ??= new Repository<Candidate>(context);

    public IRepository<Institution> Institutions => _institutions ??= new Repository<Institution>(context);

    public IRepository<SeatPlan> SeatPlans => _seatPlans ??= new Repository<SeatPlan>(context);

    public IRepository<AllocationRun> AllocationRuns => _allocationRuns ??= new Repository<AllocationRun>(context);

    public IRepository<AuditEntry> AuditEntries => _auditEntries ??= new Repository<AuditEntry>(context);

    public IRepository<AppUser> Users => _users ??= new Repository<AppUser>(context);

    public IRepository<Tenant> Tenants => _tenants ??= new Repository<Tenant>(context);
}
