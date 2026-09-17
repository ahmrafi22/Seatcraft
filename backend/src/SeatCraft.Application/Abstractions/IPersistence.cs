using SeatCraft.Domain.Entities;

namespace SeatCraft.Application.Abstractions;

/// <summary>Write + read access to one aggregate root.</summary>
public interface IRepository<T> where T : class
{
    Task<T?> FindAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(T entity, CancellationToken cancellationToken = default);

    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

    void Remove(T entity);

    void RemoveRange(IEnumerable<T> entities);

    IQueryable<T> Query();

    /// <summary>Bypasses the tenant filter. Only for flows that resolve the tenant themselves.</summary>
    IQueryable<T> QueryUnfiltered();
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken = default);
}

/// <summary>All repositories the application layer needs, resolved in one place.</summary>
public interface ISeatCraftData
{
    IRepository<Exam> Exams { get; }

    IRepository<Hall> Halls { get; }

    IRepository<Candidate> Candidates { get; }

    IRepository<Institution> Institutions { get; }

    IRepository<SeatPlan> SeatPlans { get; }

    IRepository<AllocationRun> AllocationRuns { get; }

    IRepository<AuditEntry> AuditEntries { get; }

    IRepository<AppUser> Users { get; }

    IRepository<Tenant> Tenants { get; }
}
