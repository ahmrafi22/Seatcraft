using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Contracts;
using SeatCraft.Application.Exams;
using SeatCraft.Application.Halls;
using SeatCraft.Application.Institutions;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Seed;

/// <summary>
/// Builds a realistic demo exam so a fresh clone has something to look at without
/// hand-entering hundreds of candidates.
/// </summary>
public sealed class DemoSeedService(
    ISeatCraftData data,
    IUnitOfWork unitOfWork,
    ExamService examService,
    InstitutionService institutionService,
    HallService hallService,
    ICurrentUser currentUser)
{
    public async Task<SeedResult> SeedAsync(
        string examTitle = "Demo Admission Test 2026",
        int candidateCount = 500,
        int institutionCount = 20,
        int hallCount = 12,
        int rows = 10,
        int columns = 10,
        CancellationToken cancellationToken = default)
    {
        var exam = await examService.CreateAsync(new CreateExamRequest(examTitle, "Generated demo exam"), cancellationToken);

        var institutions = new List<Guid>();
        var existingByCode = data.Institutions.Query()
            .ToList()
            .ToDictionary(institution => institution.Code, institution => institution.Id, StringComparer.OrdinalIgnoreCase);

        for (var i = 1; i <= institutionCount; i++)
        {
            var code = $"DC{i:D2}";

            if (existingByCode.TryGetValue(code, out var existingId))
            {
                institutions.Add(existingId);
                continue;
            }

            var institution = await institutionService.CreateAsync(
                new CreateInstitutionRequest($"Demo College {i:D2}", code),
                cancellationToken);

            institutions.Add(institution.Id);
        }

        for (var i = 1; i <= hallCount; i++)
        {
            await hallService.CreateAsync(
                exam.Id,
                new CreateHallRequest($"Hall {i:D2}", rows, columns),
                cancellationToken);
        }

        var tenantId = currentUser.RequireTenantId();
        var candidates = new List<Domain.Entities.Candidate>(candidateCount);

        for (var i = 0; i < candidateCount; i++)
        {
            candidates.Add(Domain.Entities.Candidate.Create(
                tenantId,
                exam.Id,
                institutions[i % institutions.Count],
                $"R{i + 1:D5}",
                $"Candidate {i + 1:D4}",
                i % 3 == 0 ? "Science" : i % 3 == 1 ? "Commerce" : "Arts",
                new DateOnly(2000, (i % 12) + 1, (i % 28) + 1)));
        }

        await data.Candidates.AddRangeAsync(candidates, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var institutionId in institutions)
        {
            var institution = await data.Institutions.FindAsync(institutionId, cancellationToken);

            if (institution is not null)
                institution.SetCandidateCount(data.Candidates.Query().Count(candidate => candidate.InstitutionId == institutionId));
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new SeedResult(exam.Id, candidateCount, institutionCount, hallCount);
    }
}

public sealed record SeedResult(Guid ExamId, int Candidates, int Institutions, int Halls);
