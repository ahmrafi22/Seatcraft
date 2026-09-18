using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace SeatCraft.Infrastructure.Persistence;

/// <summary>
/// SQLite cannot order or compare DateTimeOffset columns. Storing UTC ticks keeps
/// ordering correct on both SQLite and Postgres while the domain keeps offsets.
/// </summary>
public sealed class UtcDateTimeOffsetConverter : ValueConverter<DateTimeOffset, long>
{
    public UtcDateTimeOffsetConverter()
        : base(
            value => value.UtcTicks,
            value => new DateTimeOffset(value, TimeSpan.Zero))
    {
    }
}
