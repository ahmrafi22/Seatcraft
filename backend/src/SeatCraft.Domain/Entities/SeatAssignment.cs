namespace SeatCraft.Domain.Entities;

public sealed class SeatAssignment
{
    private SeatAssignment() { }

    internal SeatAssignment(Guid seatPlanId, Guid candidateId, Guid hallId, int row, int column)
    {
        Id = Guid.NewGuid();
        SeatPlanId = seatPlanId;
        CandidateId = candidateId;
        HallId = hallId;
        Row = row;
        Column = column;
    }

    public Guid Id { get; private set; }

    public Guid SeatPlanId { get; private set; }

    public Guid CandidateId { get; private set; }

    public Guid HallId { get; private set; }

    public int Row { get; private set; }

    public int Column { get; private set; }

    public string Label => $"R{Row + 1}-C{Column + 1}";

    /// <summary>Moves this assignment to a different seat without changing its identity.</summary>
    internal void MoveTo(Guid hallId, int row, int column)
    {
        HallId = hallId;
        Row = row;
        Column = column;
    }
}
