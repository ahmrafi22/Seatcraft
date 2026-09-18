using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Allocation;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/allocation-runs")]
[Authorize]
public sealed class AllocationRunsController(AllocationService allocationService) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid examId, CancellationToken cancellationToken) =>
        OkJson(await allocationService.ListRunsAsync(examId, cancellationToken));

    [HttpGet("{runId:guid}")]
    public async Task<IActionResult> Get(Guid examId, Guid runId, CancellationToken cancellationToken) =>
        OkJson(await allocationService.GetRunAsync(examId, runId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Start(
        Guid examId,
        [FromBody] StartAllocationRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken) =>
        OkJson(await allocationService.StartAsync(examId, request, idempotencyKey, cancellationToken));

    [HttpDelete("{runId:guid}")]
    public async Task<IActionResult> Cancel(Guid examId, Guid runId, CancellationToken cancellationToken) =>
        OkJson(await allocationService.CancelAsync(examId, runId, cancellationToken));
}
