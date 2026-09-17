namespace SeatCraft.Application.Contracts;

public sealed record AllocationRunDto(
    Guid Id,
    Guid ExamId,
    string Strategy,
    int Seed,
    string Status,
    int ProgressPercent,
    string? CurrentPhase,
    int BestViolationCount,
    Guid? ResultSeatPlanId,
    int CandidateCount,
    int HallsUsed,
    long DurationMs,
    string? FailureReason,
    DateTimeOffset CreatedAt);

public sealed record StartAllocationRequest(string Strategy = "Strict", int? Seed = null, int? TimeLimitSeconds = null);

public sealed record SeatPlanDto(
    Guid Id,
    Guid ExamId,
    Guid AllocationRunId,
    string Status,
    int ViolationCount,
    DateTimeOffset? PublishedAt,
    int AssignmentCount,
    PlanMetricsDto Metrics);

public sealed record PlanMetricsDto(
    int HallsUsed,
    int ViolationCount,
    double CapacityWastePercent,
    double InstitutionSpread,
    double RollSequenceScore);

public sealed record SeatAssignmentDto(
    Guid CandidateId,
    string Roll,
    string FullName,
    Guid InstitutionId,
    string InstitutionName,
    Guid HallId,
    string HallName,
    int Row,
    int Column,
    string SeatLabel);

public sealed record SeatPlanDetailDto(
    Guid Id,
    Guid ExamId,
    string Status,
    int ViolationCount,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<SeatAssignmentDto> Assignments,
    IReadOnlyList<PlanViolationDto> Violations);

public sealed record PlanViolationDto(string Kind, string Message, Guid? CandidateId, Guid? OtherCandidateId);

public sealed record SwapSeatsRequest(Guid FirstCandidateId, Guid SecondCandidateId);

public sealed record MoveCandidateRequest(Guid CandidateId, Guid HallId, int Row, int Column, string? Reason);

public sealed record OverrideResultDto(
    bool Applied,
    int ViolationCount,
    IReadOnlyList<PlanViolationDto> Violations,
    bool Forced);

public sealed record PublicSeatLookupDto(
    string CandidateName,
    string Roll,
    string ExamTitle,
    string HallName,
    string SeatLabel,
    DateTimeOffset? ExamDate);
