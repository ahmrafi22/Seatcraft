using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Allocation;
using SeatCraft.Application.Common;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/seat-plans/{planId:guid}/documents")]
[Authorize]
public sealed class DocumentsController(
    ISeatCraftData data,
    IAdmitCardGenerator admitCardGenerator,
    IAttendanceSheetGenerator attendanceSheetGenerator) : ControllerBase
{
    [HttpGet("admit-cards")]
    public async Task<IActionResult> AdmitCards(Guid examId, Guid planId, CancellationToken cancellationToken)
    {
        var (exam, plan, candidates, institutions, halls) = await LoadAsync(examId, planId, cancellationToken);

        var hallNames = halls.ToDictionary(hall => hall.Id, hall => hall.Name);
        var institutionNames = institutions.ToDictionary(institution => institution.Id, institution => institution.Name);
        var candidateById = candidates.ToDictionary(candidate => candidate.Id);

        using var buffer = new MemoryStream();
        using var archive = new System.IO.Compression.ZipArchive(buffer, System.IO.Compression.ZipArchiveMode.Create, leaveOpen: true);

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

            var entry = archive.CreateEntry(document.FileName, System.IO.Compression.CompressionLevel.Fastest);

            await using var entryStream = entry.Open();
            await entryStream.WriteAsync(document.Content, cancellationToken);
        }

        archive.Dispose();

        return File(buffer.ToArray(), "application/zip", $"admit-cards-{planId}.zip");
    }

    [HttpGet("attendance-sheets")]
    public async Task<IActionResult> AttendanceSheets(Guid examId, Guid planId, CancellationToken cancellationToken)
    {
        var (exam, plan, candidates, institutions, halls) = await LoadAsync(examId, planId, cancellationToken);

        var hallNames = halls.ToDictionary(hall => hall.Id, hall => hall.Name);
        var institutionNames = institutions.ToDictionary(institution => institution.Id, institution => institution.Name);
        var candidateById = candidates.ToDictionary(candidate => candidate.Id);

        using var buffer = new MemoryStream();
        using var archive = new System.IO.Compression.ZipArchive(buffer, System.IO.Compression.ZipArchiveMode.Create, leaveOpen: true);

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

            var entry = archive.CreateEntry(document.FileName, System.IO.Compression.CompressionLevel.Fastest);

            await using var entryStream = entry.Open();
            await entryStream.WriteAsync(document.Content, cancellationToken);
        }

        archive.Dispose();

        return File(buffer.ToArray(), "application/zip", $"attendance-sheets-{planId}.zip");
    }

    private async Task<(
        Domain.Entities.Exam Exam,
        Domain.Entities.SeatPlan Plan,
        List<Domain.Entities.Candidate> Candidates,
        List<Domain.Entities.Institution> Institutions,
        List<Domain.Entities.Hall> Halls)> LoadAsync(Guid examId, Guid planId, CancellationToken cancellationToken)
    {
        var exam = await data.Exams.FindAsync(examId, cancellationToken)
            ?? throw new NotFoundException($"Exam {examId} was not found.");

        var plan = await data.SeatPlans.FindAsync(planId, cancellationToken);

        if (plan is null || plan.ExamId != examId)
            throw new NotFoundException($"Seat plan {planId} was not found.");

        var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == examId).ToList();
        var institutions = data.Institutions.Query().ToList();
        var halls = data.Halls.Query().Where(hall => hall.ExamId == examId).ToList();

        return (exam, plan, candidates, institutions, halls);
    }
}
