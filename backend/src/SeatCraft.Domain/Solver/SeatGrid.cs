namespace SeatCraft.Domain.Solver;

public sealed record SeatSlot(int Index, Guid HallId, string HallName, int Row, int Column)
{
    public string Label => $"R{Row + 1}-C{Column + 1}";
}

/// <summary>Flattened, immutable view of every usable seat across all halls.</summary>
public sealed class SeatGrid
{
    private readonly int[][] _neighbors;

    private SeatGrid(IReadOnlyList<SeatSlot> slots, int[][] neighbors)
    {
        Slots = slots;
        _neighbors = neighbors;
    }

    public IReadOnlyList<SeatSlot> Slots { get; }

    public int Count => Slots.Count;

    public IReadOnlyList<int> NeighborsOf(int slotIndex) => _neighbors[slotIndex];

    public static SeatGrid Build(IReadOnlyList<SolverHall> halls)
    {
        var slots = new List<SeatSlot>();
        var indexByPosition = new Dictionary<(Guid HallId, int Row, int Column), int>();

        foreach (var hall in halls)
        {
            var blocked = hall.BlockedSeats is null
                ? new HashSet<(int, int)>()
                : hall.BlockedSeats.ToHashSet();

            for (var row = 0; row < hall.Rows; row++)
            {
                for (var column = 0; column < hall.Columns; column++)
                {
                    if (blocked.Contains((row, column)))
                        continue;

                    var index = slots.Count;
                    slots.Add(new SeatSlot(index, hall.Id, hall.Name, row, column));
                    indexByPosition[(hall.Id, row, column)] = index;
                }
            }
        }

        var neighbors = new int[slots.Count][];

        for (var i = 0; i < slots.Count; i++)
        {
            var slot = slots[i];
            var adjacent = new List<int>(4);

            foreach (var (dRow, dColumn) in Offsets)
            {
                if (indexByPosition.TryGetValue((slot.HallId, slot.Row + dRow, slot.Column + dColumn), out var neighbor))
                    adjacent.Add(neighbor);
            }

            neighbors[i] = adjacent.ToArray();
        }

        return new SeatGrid(slots, neighbors);
    }

    private static readonly (int Row, int Column)[] Offsets =
    [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1)
    ];
}
