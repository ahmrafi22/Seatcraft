using SeatCraft.Domain.Common;
using SeatCraft.Domain.Enums;

namespace SeatCraft.Domain.Entities;

public sealed class AllocationRun : TenantEntity
{
    private AllocationRun() { }

    public static AllocationRun CreateQueued(
        Guid tenantId,
        Guid examId,
        AllocationStrategyKind strategy,
        int seed,
        string idempotencyKey)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            throw new DomainException("Idempotency key is required.");

        return new AllocationRun
        {
            TenantId = tenantId,
            ExamId = examId,
            Strategy = strategy,
            Seed = seed,
            IdempotencyKey = idempotencyKey.Trim(),
            Status = AllocationRunStatus.Queued
        };
    }

    public Guid ExamId { get; private set; }

    public AllocationStrategyKind Strategy { get; private set; }

    public int Seed { get; private set; }

    public string IdempotencyKey { get; private set; } = string.Empty;

    public AllocationRunStatus Status { get; private set; }

    public int ProgressPercent { get; private set; }

    public string? CurrentPhase { get; private set; }

    public int BestViolationCount { get; private set; }

    public string? FailureReason { get; private set; }

    public Guid? ResultSeatPlanId { get; private set; }

    public long DurationMs { get; private set; }

    public int CandidateCount { get; private set; }

    public int HallsUsed { get; private set; }

    public void Start()
    {
        if (Status != AllocationRunStatus.Queued)
            throw new DomainException("Only queued runs can start.");

        Status = AllocationRunStatus.Running;
        ProgressPercent = 0;
        CurrentPhase = "Loading";
        Touch();
    }

    public void ReportProgress(int percent, string phase, int bestViolationCount)
    {
        if (Status != AllocationRunStatus.Running)
            return;

        ProgressPercent = Math.Clamp(percent, 0, 100);
        CurrentPhase = phase;
        BestViolationCount = Math.Max(0, bestViolationCount);
        Touch();
    }

    public void Complete(Guid seatPlanId, int violationCount, int hallsUsed, int candidateCount, long durationMs)
    {
        Status = AllocationRunStatus.Completed;
        ResultSeatPlanId = seatPlanId;
        BestViolationCount = Math.Max(0, violationCount);
        HallsUsed = hallsUsed;
        CandidateCount = candidateCount;
        DurationMs = durationMs;
        ProgressPercent = 100;
        CurrentPhase = "Completed";
        Touch();
    }

    public void Fail(string reason)
    {
        Status = AllocationRunStatus.Failed;
        FailureReason = reason;
        CurrentPhase = "Failed";
        Touch();
    }

    public void Cancel()
    {
        if (Status is AllocationRunStatus.Completed or AllocationRunStatus.Failed)
            throw new DomainException($"Cannot cancel a {Status} run.");

        Status = AllocationRunStatus.Cancelled;
        CurrentPhase = "Cancelled";
        Touch();
    }
}
