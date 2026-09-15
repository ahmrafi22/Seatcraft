using SeatCraft.Domain.Common;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Domain.Entities;

public sealed class Hall : TenantEntity
{
    private Hall() { }

    public static Hall Create(Guid tenantId, Guid examId, string name, HallLayout layout)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Hall name is required.");

        return new Hall
        {
            TenantId = tenantId,
            ExamId = examId,
            Name = name.Trim(),
            Layout = layout
        };
    }

    public Guid ExamId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public HallLayout Layout { get; private set; } = HallLayout.Create(1, 1);

    public int? CapacityOverride { get; private set; }

    /// <summary>Changed only through <see cref="BlockSeat"/> / <see cref="UnblockSeat"/>.</summary>
    public List<SeatPosition> BlockedSeats { get; private set; } = [];

    public int UsableCapacity => (CapacityOverride ?? Layout.Capacity) - BlockedSeats.Count;

    public void UpdateLayout(HallLayout layout)
    {
        Layout = layout;
        BlockedSeats.RemoveAll(seat => !layout.Contains(seat.Row, seat.Column));
        Touch();
    }

    public void SetCapacityOverride(int? capacity)
    {
        if (capacity is < 0)
            throw new DomainException("Capacity override cannot be negative.");

        if (capacity > Layout.Capacity)
            throw new DomainException("Capacity override cannot exceed the hall layout capacity.");

        CapacityOverride = capacity;
        Touch();
    }

    public void BlockSeat(int row, int column)
    {
        if (!Layout.Contains(row, column))
            throw new DomainException("Seat is outside the hall layout.");

        var seat = new SeatPosition(Id, row, column);

        if (!BlockedSeats.Contains(seat))
            BlockedSeats.Add(seat);

        Touch();
    }

    public void UnblockSeat(int row, int column)
    {
        BlockedSeats.RemoveAll(seat => seat.Row == row && seat.Column == column);
        Touch();
    }

    public bool IsSeatUsable(int row, int column) =>
        Layout.Contains(row, column) && !BlockedSeats.Any(seat => seat.Row == row && seat.Column == column);
}
