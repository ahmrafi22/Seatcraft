using System.Collections.Concurrent;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Concurrency;

/// <summary>
/// Single-process lock. Correct for one instance; swap for the Redis implementation
/// when running more than one API replica.
/// </summary>
public sealed class InMemoryDistributedLock : IDistributedLock
{
    private readonly ConcurrentDictionary<string, byte> _held = new(StringComparer.Ordinal);

    public Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        if (!_held.TryAdd(key, 1))
            return Task.FromResult<IAsyncDisposable?>(null);

        return Task.FromResult<IAsyncDisposable?>(new Handle(this, key));
    }

    private sealed class Handle(InMemoryDistributedLock owner, string key) : IAsyncDisposable
    {
        private int _released;

        public ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _released, 1) == 0)
                owner._held.TryRemove(key, out _);

            return ValueTask.CompletedTask;
        }
    }
}
