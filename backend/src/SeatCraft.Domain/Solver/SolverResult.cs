namespace SeatCraft.Domain.Solver;

public sealed record SeatPlacement(Guid CandidateId, Guid HallId, int Row, int Column)
{
    public string Label => $"R{Row + 1}-C{Column + 1}";
}

public enum ViolationKind
{
    SameInstitutionAdjacent = 0,
    SubjectGroupSplit = 1,
    RollOrderBroken = 2
}

public sealed record PlanViolation(
    ViolationKind Kind,
    string Message,
    Guid? CandidateId = null,
    Guid? OtherCandidateId = null);

public sealed record PlanMetrics(
    int CandidateCount,
    int SeatCount,
    int HallsUsed,
    int ViolationCount,
    double CapacityWastePercent,
    double InstitutionSpread,
    double RollSequenceScore,
    long DurationMs);

public sealed record SolverResult(
    IReadOnlyList<SeatPlacement> Placements,
    IReadOnlyList<PlanViolation> Violations,
    PlanMetrics Metrics,
    bool IsOptimal,
    bool CompletedWithinTimeLimit)
{
    public bool IsFeasible => Violations.Count == 0;
}
