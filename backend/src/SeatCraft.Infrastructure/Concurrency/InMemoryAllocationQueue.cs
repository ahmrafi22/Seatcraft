using System.Threading.Channels;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Concurrency;

/// <summary>Bounded in-process queue. Work is lost on restart, which is acceptable for a draft plan.</summary>
public sealed class InMemoryAllocationQueue : IAllocationQueue
{
    private readonly Channel<AllocationJob> _channel = Channel.CreateBounded<AllocationJob>(
        new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true
        });

    public ValueTask EnqueueAsync(AllocationJob job, CancellationToken cancellationToken = default) =>
        _channel.Writer.WriteAsync(job, cancellationToken);

    public ValueTask<AllocationJob> DequeueAsync(CancellationToken cancellationToken) =>
        _channel.Reader.ReadAsync(cancellationToken);
}
