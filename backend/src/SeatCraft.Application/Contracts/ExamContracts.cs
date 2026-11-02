using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Contracts;

public sealed record ExamDto(
    Guid Id,
    string Title,
    string? Description,
    string Status,
    AllocationConstraints Constraints,
    Guid? ActiveSeatPlanId,
    int CandidateCount,
    int HallCount,
    DateTimeOffset CreatedAt);

public sealed record CreateExamRequest(string Title, string? Description);

public sealed record UpdateExamRequest(string Title, string? Description);

public sealed record UpdateConstraintsRequest(
    bool PreventSameInstitutionAdjacent,
    bool KeepSubjectGroupContiguous,
    bool MaintainRollOrder,
    bool AllowHallSkipping);

public sealed record InstitutionDto(Guid Id, string Name, string Code, int CandidateCount);

public sealed record CreateInstitutionRequest(string Name, string Code);

public sealed record UpdateInstitutionRequest(string Name, string Code);

public sealed record HallDto(
    Guid Id,
    string Name,
    int Rows,
    int Columns,
    int Capacity,
    int UsableCapacity,
    IReadOnlyList<SeatPositionDto> BlockedSeats);

public sealed record SeatPositionDto(int Row, int Column, string Label);

public sealed record CreateHallRequest(string Name, int Rows, int Columns);

public sealed record UpdateHallLayoutRequest(int Rows, int Columns, int? CapacityOverride);

public sealed record CandidateDto(
    Guid Id,
    string Roll,
    string FullName,
    string SubjectGroup,
    Guid InstitutionId,
    string InstitutionName,
    string? PhotoUrl,
    bool IsSeatLocked);

public sealed record CreateCandidateRequest(string Roll, string FullName, string SubjectGroup, Guid InstitutionId);

public sealed record CandidateImportResult(int Imported, int Skipped, IReadOnlyList<CandidateImportError> Errors);

public sealed record CandidateImportError(int Line, string Message);
