using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Caching;

/// <summary>In-process fallback so local development needs no Redis.</summary>
public sealed class InMemoryPlanCache(IMemoryCache cache) : IPlanCache
{
    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class =>
        Task.FromResult(cache.TryGetValue(key, out T? value) ? value : null);

    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default) where T : class
    {
        cache.Set(key, value, ttl);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        cache.Remove(key);
        return Task.CompletedTask;
    }
}

public sealed class DistributedPlanCache(IDistributedCache cache) : IPlanCache
{
    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class =>
        await cache.GetStringAsync(key, cancellationToken) is { } json
            ? System.Text.Json.JsonSerializer.Deserialize<T>(json)
            : null;

    public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default) where T : class =>
        cache.SetStringAsync(
            key,
            System.Text.Json.JsonSerializer.Serialize(value),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl },
            cancellationToken);

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default) =>
        cache.RemoveAsync(key, cancellationToken);
}
