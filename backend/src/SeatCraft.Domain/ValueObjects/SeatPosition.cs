namespace SeatCraft.Domain.ValueObjects;

/// <summary>A hall seat address, e.g. row 3 / column 7 of hall "A-201".</summary>
public readonly record struct SeatPosition(Guid HallId, int Row, int Column)
{
    public string Label => $"R{Row + 1}-C{Column + 1}";
}
