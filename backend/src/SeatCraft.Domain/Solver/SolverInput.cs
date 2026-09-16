using SeatCraft.Domain.Enums;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Domain.Solver;

public sealed record SolverCandidate(
    Guid Id,
    Guid InstitutionId,
    string Roll,
    string SubjectGroup,
    Guid? LockedHallId = null,
    int? LockedRow = null,
    int? LockedColumn = null)
{
    public bool HasLockedSeat => LockedHallId.HasValue && LockedRow.HasValue && LockedColumn.HasValue;
}

public sealed record SolverHall(
    Guid Id,
    string Name,
    int Rows,
    int Columns,
    IReadOnlyList<(int Row, int Column)>? BlockedSeats = null);

public sealed record SolverInput(
    IReadOnlyList<SolverCandidate> Candidates,
    IReadOnlyList<SolverHall> Halls,
    AllocationConstraints Constraints,
    AllocationStrategyKind Strategy = AllocationStrategyKind.Balanced,
    int Seed = 0,
    TimeSpan? TimeLimit = null);
