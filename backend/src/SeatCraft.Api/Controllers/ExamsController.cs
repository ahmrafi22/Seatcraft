using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Contracts;
using SeatCraft.Application.Exams;

namespace SeatCraft.Api.Controllers;

[Route("api/exams")]
[Authorize]
public sealed class ExamsController(ExamService examService) : ApiControllerBase
{
    [HttpGet]
    public IActionResult List() => OkJson(examService.List());

    [HttpGet("{examId:guid}")]
    public async Task<IActionResult> Get(Guid examId, CancellationToken cancellationToken) =>
        OkJson(await examService.GetAsync(examId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExamRequest request, CancellationToken cancellationToken)
    {
        var exam = await examService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(Get), new { examId = exam.Id }, exam);
    }

    [HttpPut("{examId:guid}")]
    public async Task<IActionResult> Update(Guid examId, [FromBody] UpdateExamRequest request, CancellationToken cancellationToken) =>
        OkJson(await examService.UpdateAsync(examId, request, cancellationToken));

    [HttpPut("{examId:guid}/constraints")]
    public async Task<IActionResult> UpdateConstraints(
        Guid examId,
        [FromBody] UpdateConstraintsRequest request,
        CancellationToken cancellationToken) =>
        OkJson(await examService.UpdateConstraintsAsync(examId, request, cancellationToken));

    [HttpPost("{examId:guid}/archive")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Archive(Guid examId, CancellationToken cancellationToken) =>
        OkJson(await examService.ArchiveAsync(examId, cancellationToken));

    [HttpDelete("{examId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid examId, CancellationToken cancellationToken)
    {
        await examService.DeleteAsync(examId, cancellationToken);

        return NoContent();
    }
}
