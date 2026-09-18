using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Candidates;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/candidates")]
[Authorize]
public sealed class CandidatesController(CandidateService candidateService, CandidateImportService importService) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        Guid examId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default) =>
        OkJson(await candidateService.ListAsync(examId, page, pageSize, search, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid examId, [FromBody] CreateCandidateRequest request, CancellationToken cancellationToken) =>
        OkJson(await candidateService.CreateAsync(examId, request, cancellationToken));

    [HttpPost("import")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Import(Guid examId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            throw new SeatCraft.Application.Common.ValidationFailedException("file", "The uploaded file is empty.");

        await using var stream = file.OpenReadStream();

        return OkJson(await importService.ImportAsync(examId, stream, cancellationToken));
    }

    [HttpDelete("{candidateId:guid}")]
    public async Task<IActionResult> Delete(Guid examId, Guid candidateId, CancellationToken cancellationToken)
    {
        await candidateService.DeleteAsync(examId, candidateId, cancellationToken);

        return NoContent();
    }

    [HttpDelete]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Clear(Guid examId, CancellationToken cancellationToken)
    {
        var removed = await candidateService.ClearAsync(examId, cancellationToken);

        return OkJson(new { removed });
    }
}
