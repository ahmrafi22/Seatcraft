using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Documents;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/seat-plans/{planId:guid}/documents")]
[Authorize]
public sealed class DocumentsController(
    ISeatCraftData data,
    IDownloadLinkIssuer downloadLinks,
    DocumentArchiveService archives) : ApiControllerBase
{
    [HttpGet("admit-cards")]
    public Task<IActionResult> AdmitCards(Guid examId, Guid planId, CancellationToken cancellationToken) =>
        DownloadAsync(examId, planId, DocumentKind.AdmitCards, cancellationToken);

    [HttpGet("attendance-sheets")]
    public Task<IActionResult> AttendanceSheets(Guid examId, Guid planId, CancellationToken cancellationToken) =>
        DownloadAsync(examId, planId, DocumentKind.AttendanceSheets, cancellationToken);

    /// <summary>
    /// Hands back a signed URL the browser can fetch directly, so a large archive is
    /// streamed by the API instead of being buffered by the web tier. Expires in ten
    /// minutes and is scoped to one plan and one document kind.
    /// </summary>
    [HttpPost("{kind}/link")]
    public IActionResult CreateLink(Guid examId, Guid planId, string kind)
    {
        var documentKind = kind switch
        {
            "admit-cards" => DocumentKind.AdmitCards,
            "attendance-sheets" => DocumentKind.AttendanceSheets,
            _ => throw new NotFoundException($"Unknown document kind '{kind}'.")
        };

        var plan = data.SeatPlans.Query()
            .FirstOrDefault(entry => entry.Id == planId && entry.ExamId == examId)
            ?? throw new NotFoundException($"Seat plan {planId} was not found.");

        var link = downloadLinks.Issue(plan.TenantId, examId, planId, documentKind);

        return OkJson(new { url = $"/api/public/documents/{link.Token}", expiresAt = link.ExpiresAt });
    }

    private async Task<IActionResult> DownloadAsync(
        Guid examId,
        Guid planId,
        DocumentKind kind,
        CancellationToken cancellationToken)
    {
        var archive = await archives.BuildAsync(examId, planId, kind, cancellationToken);

        return File(archive.Content, "application/zip", archive.FileName);
    }
}
