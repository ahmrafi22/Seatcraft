namespace SeatCraft.Application.Abstractions;

/// <summary>
/// Cluster-wide mutual exclusion so two operators cannot start the same exam's
/// allocation at once. Redis in production, in-process for local dev.
/// </summary>
public interface IDistributedLock
{
    Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan ttl, CancellationToken cancellationToken = default);
}

public interface IPlanCache
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;

    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default) where T : class;

    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}
