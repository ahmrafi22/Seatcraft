using System.IO.Compression;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;

namespace SeatCraft.Application.Documents;

public enum DocumentKind
{
    AdmitCards,
    AttendanceSheets
}

public sealed record DocumentArchive(byte[] Content, string FileName);

/// <summary>
/// Builds the zipped PDF bundles. Kept out of the controller so the same code serves
/// both the authenticated endpoint and a signed public link.
/// </summary>
public sealed class DocumentArchiveService(
    ISeatCraftData data,
    IAdmitCardGenerator admitCardGenerator,
    IAttendanceSheetGenerator attendanceSheetGenerator)
{
    public async Task<DocumentArchive> BuildAsync(
        Guid examId,
        Guid planId,
        DocumentKind kind,
        CancellationToken cancellationToken = default)
    {
        var exam = await data.Exams.FindAsync(examId, cancellationToken)
            ?? throw new NotFoundException($"Exam {examId} was not found.");

        var plan = await data.SeatPlans.FindAsync(planId, cancellationToken);

        if (plan is null || plan.ExamId != examId)
            throw new NotFoundException($"Seat plan {planId} was not found.");

        var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == examId).ToList();
        var institutions = data.Institutions.Query().ToList();
        var halls = data.Halls.Query().Where(hall => hall.ExamId == examId).ToList();

        var content = kind == DocumentKind.AdmitCards
            ? BuildAdmitCards(exam, plan, candidates, institutions, halls)
            : BuildAttendanceSheets(exam, plan, candidates, institutions, halls);

        var name = kind == DocumentKind.AdmitCards ? "admit-cards" : "attendance-sheets";

        return new DocumentArchive(content, $"{name}-{planId}.zip");
    }

    private byte[] BuildAdmitCards(
        Domain.Entities.Exam exam,
        Domain.Entities.SeatPlan plan,
        List<Domain.Entities.Candidate> candidates,
        List<Domain.Entities.Institution> institutions,
        List<Domain.Entities.Hall> halls)
    {
        var hallNames = halls.ToDictionary(hall => hall.Id, hall => hall.Name);
        var institutionNames = institutions.ToDictionary(institution => institution.Id, institution => institution.Name);
        var candidateById = candidates.ToDictionary(candidate => candidate.Id);

        using var buffer = new MemoryStream();
        using var archive = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true);

        foreach (var assignment in plan.Assignments)
        {
            if (!candidateById.TryGetValue(assignment.CandidateId, out var candidate))
                continue;

            var document = admitCardGenerator.Generate(new AdmitCardModel(
                exam.Title,
                candidate.FullName,
                candidate.Roll,
                institutionNames.GetValueOrDefault(candidate.InstitutionId, string.Empty),
                candidate.SubjectGroup,
                hallNames.GetValueOrDefault(assignment.HallId, string.Empty),
                assignment.Label,
                exam.CreatedAt,
                candidate.PhotoUrl));

            var entry = archive.CreateEntry(document.FileName, CompressionLevel.Fastest);

            using var entryStream = entry.Open();
            entryStream.Write(document.Content);
        }

        archive.Dispose();

        return buffer.ToArray();
    }

    private byte[] BuildAttendanceSheets(
        Domain.Entities.Exam exam,
        Domain.Entities.SeatPlan plan,
        List<Domain.Entities.Candidate> candidates,
        List<Domain.Entities.Institution> institutions,
        List<Domain.Entities.Hall> halls)
    {
        var hallNames = halls.ToDictionary(hall => hall.Id, hall => hall.Name);
        var institutionNames = institutions.ToDictionary(institution => institution.Id, institution => institution.Name);
        var candidateById = candidates.ToDictionary(candidate => candidate.Id);

        using var buffer = new MemoryStream();
        using var archive = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true);

        foreach (var hallGroup in plan.Assignments.GroupBy(assignment => assignment.HallId))
        {
            var rows = hallGroup
                .Select(assignment => candidateById.GetValueOrDefault(assignment.CandidateId))
                .Where(candidate => candidate is not null)
                .OrderBy(candidate => candidate!.Roll)
                .Select((candidate, index) => new AttendanceRow(
                    index + 1,
                    candidate!.Roll,
                    candidate.FullName,
                    institutionNames.GetValueOrDefault(candidate.InstitutionId, string.Empty),
                    hallGroup.First(assignment => assignment.CandidateId == candidate.Id).Label))
                .ToList();

            var document = attendanceSheetGenerator.Generate(new AttendanceSheetModel(
                exam.Title,
                hallNames.GetValueOrDefault(hallGroup.Key, "Hall"),
                exam.CreatedAt,
                rows));

            var entry = archive.CreateEntry(document.FileName, CompressionLevel.Fastest);

            using var entryStream = entry.Open();
            entryStream.Write(document.Content);
        }

        archive.Dispose();

        return buffer.ToArray();
    }
}
