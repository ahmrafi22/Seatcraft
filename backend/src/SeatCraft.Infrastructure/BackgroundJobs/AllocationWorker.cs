using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Allocation;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Infrastructure.BackgroundJobs;

/// <summary>
/// Drains the allocation queue on a dedicated worker so requests stay fast. Each job
/// restores its tenant into the scope, otherwise the EF tenant filter would hide it.
/// </summary>
public sealed class AllocationWorker(
    IAllocationQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<AllocationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            AllocationJob job;

            try
            {
                job = await queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();

                scope.ServiceProvider.GetRequiredService<TenantContext>().Set(job.TenantId);

                var runner = scope.ServiceProvider.GetRequiredService<AllocationRunner>();

                await runner.RunAsync(job, stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Allocation job for exam {ExamId} failed", job.ExamId);
            }
        }
    }
}
