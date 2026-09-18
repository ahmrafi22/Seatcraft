using SeatCraft.Application.Abstractions;
using StackExchange.Redis;

namespace SeatCraft.Infrastructure.Concurrency;

/// <summary>Redis lock via SET NX with a TTL, released only by the owning token.</summary>
public sealed class RedisDistributedLock(IConnectionMultiplexer multiplexer) : IDistributedLock
{
    public async Task<IAsyncDisposable?> TryAcquireAsync(string key, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var database = multiplexer.GetDatabase();
        var token = Guid.NewGuid().ToString("N");

        var acquired = await database.StringSetAsync(
            $"lock:{key}",
            token,
            ttl,
            When.NotExists);

        return acquired ? new Handle(database, $"lock:{key}", token) : null;
    }

    private sealed class Handle(IDatabase database, string key, string token) : IAsyncDisposable
    {
        private const string ReleaseScript = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            end
            return 0
            """;

        private int _released;

        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _released, 1) == 1)
                return;

            await database.ScriptEvaluateAsync(ReleaseScript, [key], [token]);
        }
    }
}
