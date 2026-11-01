using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Documents;
using SeatCraft.Infrastructure.Persistence;

namespace SeatCraft.Api.Controllers;

/// <summary>
/// Serves a document archive from a signed, expiring link. The caller is anonymous,
/// so the tenant is taken from the token rather than from a JWT claim.
/// </summary>
[Route("api/public/documents")]
[AllowAnonymous]
public sealed class PublicDocumentsController(
    IDownloadLinkIssuer downloadLinks,
    TenantContext tenantContext,
    DocumentArchiveService archives) : ControllerBase
{
    [HttpGet("{token}")]
    public async Task<IActionResult> Download(string token, CancellationToken cancellationToken)
    {
        var ticket = downloadLinks.Read(token)
            ?? throw new NotFoundException("This download link is invalid or has expired.");

        tenantContext.Set(ticket.TenantId);

        var archive = await archives.BuildAsync(ticket.ExamId, ticket.PlanId, ticket.Kind, cancellationToken);

        return File(archive.Content, "application/zip", archive.FileName);
    }
}
