using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Application.Candidates;

public sealed class CandidateService(ISeatCraftData data, IUnitOfWork unitOfWork, ICurrentUser currentUser)
{
    public async Task<PagedResult<CandidateDto>> ListAsync(
        Guid examId,
        int page = 1,
        int pageSize = 50,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureExamAsync(examId, cancellationToken);

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var institutions = data.Institutions.Query().ToDictionary(institution => institution.Id, institution => institution.Name);

        var query = data.Candidates.Query().Where(candidate => candidate.ExamId == examId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(candidate => candidate.Roll.Contains(term) || candidate.FullName.Contains(term));
        }

        var total = query.Count();

        var items = query
            .OrderBy(candidate => candidate.Roll)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList()
            .Select(candidate => ToDto(candidate, institutions))
            .ToList();

        await Task.CompletedTask;

        return new PagedResult<CandidateDto>(items, page, pageSize, total);
    }

    public async Task<CandidateDto> CreateAsync(Guid examId, CreateCandidateRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureExamAsync(examId, cancellationToken);

        var institution = await data.Institutions.FindAsync(request.InstitutionId, cancellationToken)
            ?? throw new NotFoundException($"Institution {request.InstitutionId} was not found.");

        if (data.Candidates.Query().Any(candidate => candidate.ExamId == examId && candidate.Roll == request.Roll.Trim()))
            throw new ConflictException($"Roll '{request.Roll}' already exists for this exam.");

        var candidate = Candidate.Create(
            currentUser.RequireTenantId(),
            examId,
            institution.Id,
            request.Roll,
            request.FullName,
            request.SubjectGroup);

        await data.Candidates.AddAsync(candidate, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await RefreshInstitutionCountAsync(institution.Id, cancellationToken);

        return ToDto(candidate, new Dictionary<Guid, string> { [institution.Id] = institution.Name });
    }

    public async Task DeleteAsync(Guid examId, Guid candidateId, CancellationToken cancellationToken = default)
    {
        var candidate = await data.Candidates.FindAsync(candidateId, cancellationToken);

        if (candidate is null || candidate.ExamId != examId)
            throw new NotFoundException($"Candidate {candidateId} was not found for exam {examId}.");

        data.Candidates.Remove(candidate);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await RefreshInstitutionCountAsync(candidate.InstitutionId, cancellationToken);
    }

    public async Task<int> ClearAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == examId).ToList();

        data.Candidates.RemoveRange(candidates);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return candidates.Count;
    }

    public async Task RefreshInstitutionCountAsync(Guid institutionId, CancellationToken cancellationToken = default)
    {
        var institution = await data.Institutions.FindAsync(institutionId, cancellationToken);
        if (institution is null)
            return;

        institution.SetCandidateCount(data.Candidates.Query().Count(candidate => candidate.InstitutionId == institutionId));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    internal static CandidateDto ToDto(Candidate candidate, IReadOnlyDictionary<Guid, string> institutionNames) => new(
        candidate.Id,
        candidate.Roll,
        candidate.FullName,
        candidate.SubjectGroup,
        candidate.InstitutionId,
        institutionNames.TryGetValue(candidate.InstitutionId, out var name) ? name : string.Empty,
        candidate.PhotoUrl,
        candidate.IsSeatLocked);

    private async Task EnsureExamAsync(Guid examId, CancellationToken cancellationToken)
    {
        if (await data.Exams.FindAsync(examId, cancellationToken) is null)
            throw new NotFoundException($"Exam {examId} was not found.");
    }
}
