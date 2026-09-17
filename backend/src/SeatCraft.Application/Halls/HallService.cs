using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Halls;

public sealed class HallService(ISeatCraftData data, IUnitOfWork unitOfWork, ICurrentUser currentUser)
{
    public async Task<IReadOnlyList<HallDto>> ListAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        await EnsureExamAsync(examId, cancellationToken);

        var halls = data.Halls.Query()
            .Where(hall => hall.ExamId == examId)
            .OrderBy(hall => hall.Name)
            .ToList();

        return halls.Select(ToDto).ToList();
    }

    public async Task<HallDto> CreateAsync(Guid examId, CreateHallRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureExamAsync(examId, cancellationToken);

        if (data.Halls.Query().Any(hall => hall.ExamId == examId && hall.Name == request.Name.Trim()))
            throw new ConflictException($"Hall '{request.Name}' already exists for this exam.");

        var hall = Hall.Create(
            currentUser.RequireTenantId(),
            examId,
            request.Name,
            HallLayout.Create(request.Rows, request.Columns));

        await data.Halls.AddAsync(hall, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(hall);
    }

    public async Task<HallDto> UpdateLayoutAsync(Guid examId, Guid hallId, UpdateHallLayoutRequest request, CancellationToken cancellationToken = default)
    {
        var hall = await LoadAsync(examId, hallId, cancellationToken);

        hall.UpdateLayout(HallLayout.Create(request.Rows, request.Columns));
        hall.SetCapacityOverride(request.CapacityOverride);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(hall);
    }

    public async Task<HallDto> BlockSeatAsync(Guid examId, Guid hallId, int row, int column, CancellationToken cancellationToken = default)
    {
        var hall = await LoadAsync(examId, hallId, cancellationToken);

        hall.BlockSeat(row, column);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(hall);
    }

    public async Task<HallDto> UnblockSeatAsync(Guid examId, Guid hallId, int row, int column, CancellationToken cancellationToken = default)
    {
        var hall = await LoadAsync(examId, hallId, cancellationToken);

        hall.UnblockSeat(row, column);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(hall);
    }

    public async Task DeleteAsync(Guid examId, Guid hallId, CancellationToken cancellationToken = default)
    {
        var hall = await LoadAsync(examId, hallId, cancellationToken);

        data.Halls.Remove(hall);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    internal static HallDto ToDto(Hall hall) => new(
        hall.Id,
        hall.Name,
        hall.Layout.Rows,
        hall.Layout.Columns,
        hall.Layout.Capacity,
        hall.UsableCapacity,
        hall.BlockedSeats
            .OrderBy(seat => seat.Row)
            .ThenBy(seat => seat.Column)
            .Select(seat => new SeatPositionDto(seat.Row, seat.Column, seat.Label))
            .ToList());

    private async Task<Hall> LoadAsync(Guid examId, Guid hallId, CancellationToken cancellationToken)
    {
        var hall = await data.Halls.FindAsync(hallId, cancellationToken);

        if (hall is null || hall.ExamId != examId)
            throw new NotFoundException($"Hall {hallId} was not found for exam {examId}.");

        return hall;
    }

    private async Task EnsureExamAsync(Guid examId, CancellationToken cancellationToken)
    {
        if (await data.Exams.FindAsync(examId, cancellationToken) is null)
            throw new NotFoundException($"Exam {examId} was not found.");
    }
}
