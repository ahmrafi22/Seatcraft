using System.Text.Json;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Infrastructure.Persistence.Configurations;

/// <summary>Stores blocked seats as a small JSON array, avoiding a join table.</summary>
internal static class SeatPositionListConverter
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string ToString(IEnumerable<SeatPosition> seats) =>
        JsonSerializer.Serialize(seats.Select(seat => new SeatDto(seat.Row, seat.Column)).ToList(), Options);

    public static List<SeatPosition> FromList(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return [];

        var seats = JsonSerializer.Deserialize<List<SeatDto>>(value, Options) ?? [];

        return seats.Select(seat => new SeatPosition(Guid.Empty, seat.Row, seat.Column)).ToList();
    }

    private sealed record SeatDto(int Row, int Column);
}
