using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Allocation;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/seat-plans")]
[Authorize]
public sealed class SeatPlansController(SeatPlanService seatPlanService) : ApiControllerBase
{
    [HttpGet("{planId:guid}")]
    public async Task<IActionResult> Get(Guid examId, Guid planId, CancellationToken cancellationToken) =>
        OkJson(await seatPlanService.GetAsync(examId, planId, cancellationToken));

    [HttpPost("{planId:guid}/publish")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Publish(Guid examId, Guid planId, CancellationToken cancellationToken) =>
        OkJson(await seatPlanService.PublishAsync(examId, planId, cancellationToken));

    [HttpPost("{planId:guid}/swap")]
    public async Task<IActionResult> Swap(
        Guid examId,
        Guid planId,
        [FromBody] SwapSeatsRequest request,
        [FromQuery] bool force = false,
        [FromQuery] string? reason = null,
        CancellationToken cancellationToken = default) =>
        OkJson(await seatPlanService.SwapAsync(examId, planId, request, force, reason, cancellationToken));

    [HttpPost("{planId:guid}/move")]
    public async Task<IActionResult> Move(
        Guid examId,
        Guid planId,
        [FromBody] MoveCandidateRequest request,
        [FromQuery] bool force = false,
        CancellationToken cancellationToken = default) =>
        OkJson(await seatPlanService.MoveAsync(examId, planId, request, force, cancellationToken));

    [HttpGet("{planId:guid}/violations")]
    public async Task<IActionResult> Violations(Guid examId, Guid planId, CancellationToken cancellationToken) =>
        OkJson(await seatPlanService.RevalidateAsync(examId, planId, cancellationToken));

    [HttpDelete("{planId:guid}")]
    public async Task<IActionResult> Delete(Guid examId, Guid planId, CancellationToken cancellationToken)
    {
        await seatPlanService.DeleteAsync(examId, planId, cancellationToken);

        return NoContent();
    }
}
