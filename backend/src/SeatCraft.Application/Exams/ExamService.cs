using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Application.Exams;

public sealed class ExamService(ISeatCraftData data, IUnitOfWork unitOfWork, ICurrentUser currentUser)
{
    public IReadOnlyList<ExamDto> List()
    {
        var exams = data.Exams.Query().OrderByDescending(exam => exam.CreatedAt).ToList();

        return exams.Select(ToDto).ToList();
    }

    public async Task<ExamDto> GetAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await LoadAsync(id, cancellationToken);

        return ToDto(exam);
    }

    public async Task<ExamDto> CreateAsync(CreateExamRequest request, CancellationToken cancellationToken = default)
    {
        var exam = Exam.Create(currentUser.RequireTenantId(), request.Title, request.Description);

        await data.Exams.AddAsync(exam, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(exam);
    }

    public async Task<ExamDto> UpdateAsync(Guid id, UpdateExamRequest request, CancellationToken cancellationToken = default)
    {
        var exam = await LoadAsync(id, cancellationToken);
        exam.Rename(request.Title, request.Description);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(exam);
    }

    public async Task<ExamDto> UpdateConstraintsAsync(Guid id, UpdateConstraintsRequest request, CancellationToken cancellationToken = default)
    {
        var exam = await LoadAsync(id, cancellationToken);

        exam.UpdateConstraints(new Domain.ValueObjects.AllocationConstraints
        {
            PreventSameInstitutionAdjacent = request.PreventSameInstitutionAdjacent,
            KeepSubjectGroupContiguous = request.KeepSubjectGroupContiguous,
            MaintainRollOrder = request.MaintainRollOrder,
            AllowHallSkipping = request.AllowHallSkipping
        });

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(exam);
    }

    public async Task<ExamDto> ArchiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await LoadAsync(id, cancellationToken);
        exam.Archive();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(exam);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var exam = await LoadAsync(id, cancellationToken);
        data.Exams.Remove(exam);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    internal async Task<Exam> LoadAsync(Guid id, CancellationToken cancellationToken)
    {
        var exam = await data.Exams.FindAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Exam {id} was not found.");

        return exam;
    }

    private ExamDto ToDto(Exam exam)
    {
        var candidateCount = data.Candidates.Query().Count(candidate => candidate.ExamId == exam.Id);
        var hallCount = data.Halls.Query().Count(hall => hall.ExamId == exam.Id);

        return new ExamDto(
            exam.Id,
            exam.Title,
            exam.Description,
            exam.Status.ToString(),
            exam.Constraints,
            exam.ActiveSeatPlanId,
            candidateCount,
            hallCount,
            exam.CreatedAt);
    }
}
