namespace SeatCraft.Domain.ValueObjects;

public sealed record HallLayout(int Rows, int Columns)
{
    public int Capacity => Rows * Columns;

    public bool Contains(int row, int column) =>
        row >= 0 && row < Rows && column >= 0 && column < Columns;

    public static HallLayout Create(int rows, int columns)
    {
        if (rows is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(rows), "Rows must be between 1 and 100.");

        if (columns is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(columns), "Columns must be between 1 and 100.");

        return new HallLayout(rows, columns);
    }
}
