using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Common;
using SeatCraft.Domain.Entities;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Allocation;

public sealed class AllocationService(
    ISeatCraftData data,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IAllocationQueue queue)
{
    public async Task<AllocationRunDto> StartAsync(
        Guid examId,
        StartAllocationRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        var exam = await LoadExamAsync(examId, cancellationToken);

        if (exam.Status == ExamStatus.Published)
            throw new ConflictException("A published exam cannot be re-allocated. Create a new plan first.");

        var strategy = ParseStrategy(request.Strategy);
        var key = string.IsNullOrWhiteSpace(idempotencyKey)
            ? Guid.NewGuid().ToString("N")
            : idempotencyKey.Trim();

        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existing = data.AllocationRuns.Query()
                .Where(run => run.ExamId == examId && run.IdempotencyKey == key)
                .OrderByDescending(run => run.CreatedAt)
                .FirstOrDefault();

            if (existing is not null)
                return ToDto(existing);
        }

        var seed = request.Seed ?? Random.Shared.Next(1, int.MaxValue);

        var run = AllocationRun.CreateQueued(currentUser.RequireTenantId(), examId, strategy, seed, key);

        await data.AllocationRuns.AddAsync(run, cancellationToken);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (UniqueConstraintViolationException)
        {
            // Another request won the race; return the run it created so the caller
            // still gets a usable response instead of a spurious error.
            var winner = data.AllocationRuns.Query()
                .Where(candidate => candidate.ExamId == examId && candidate.IdempotencyKey == key)
                .OrderByDescending(candidate => candidate.CreatedAt)
                .FirstOrDefault();

            if (winner is not null)
                return ToDto(winner);

            throw new ConflictException("An allocation run is already in progress for this exam.");
        }

        await queue.EnqueueAsync(new AllocationJob(run.TenantId, examId, run.Id, seed), cancellationToken);

        return ToDto(run);
    }

    public async Task<AllocationRunDto> GetRunAsync(Guid examId, Guid runId, CancellationToken cancellationToken = default)
    {
        var run = await data.AllocationRuns.FindAsync(runId, cancellationToken);

        if (run is null || run.ExamId != examId)
            throw new NotFoundException($"Allocation run {runId} was not found.");

        return ToDto(run);
    }

    public async Task<IReadOnlyList<AllocationRunDto>> ListRunsAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        await LoadExamAsync(examId, cancellationToken);

        return data.AllocationRuns.Query()
            .Where(run => run.ExamId == examId)
            .OrderByDescending(run => run.CreatedAt)
            .Take(50)
            .ToList()
            .Select(ToDto)
            .ToList();
    }
    public async Task<AllocationRunDto> CancelAsync(Guid examId, Guid runId, CancellationToken cancellationToken = default)
    {
        var run = await data.AllocationRuns.FindAsync(runId, cancellationToken);

        if (run is null || run.ExamId != examId)
            throw new NotFoundException($"Allocation run {runId} was not found.");

        try
        {
            run.Cancel();
        }
        catch (DomainException exception)
        {
            // Cancelling a finished run is a state conflict, not a malformed request.
            throw new ConflictException(exception.Message);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(run);
    }

    public static AllocationStrategyKind ParseStrategy(string? value) =>
        Enum.TryParse<AllocationStrategyKind>(value, ignoreCase: true, out var strategy)
            ? strategy
            : throw new ValidationFailedException("strategy", $"Unknown strategy '{value}'. Use Greedy, Balanced or Strict.");

    public static AllocationRunDto ToDto(AllocationRun run) => new(
        run.Id,
        run.ExamId,
        run.Strategy.ToString(),
        run.Seed,
        run.Status.ToString(),
        run.ProgressPercent,
        run.CurrentPhase,
        run.BestViolationCount,
        run.ResultSeatPlanId,
        run.CandidateCount,
        run.HallsUsed,
        run.DurationMs,
        run.FailureReason,
        run.CreatedAt);

    private async Task<Exam> LoadExamAsync(Guid examId, CancellationToken cancellationToken) =>
        await data.Exams.FindAsync(examId, cancellationToken)
        ?? throw new NotFoundException($"Exam {examId} was not found.");
}
