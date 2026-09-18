using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Contracts;
using SeatCraft.Application.Halls;

namespace SeatCraft.Api.Controllers;

[Route("api/exams/{examId:guid}/halls")]
[Authorize]
public sealed class HallsController(HallService hallService) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(Guid examId, CancellationToken cancellationToken) =>
        OkJson(await hallService.ListAsync(examId, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(Guid examId, [FromBody] CreateHallRequest request, CancellationToken cancellationToken) =>
        OkJson(await hallService.CreateAsync(examId, request, cancellationToken));

    [HttpPut("{hallId:guid}/layout")]
    public async Task<IActionResult> UpdateLayout(
        Guid examId,
        Guid hallId,
        [FromBody] UpdateHallLayoutRequest request,
        CancellationToken cancellationToken) =>
        OkJson(await hallService.UpdateLayoutAsync(examId, hallId, request, cancellationToken));

    [HttpPost("{hallId:guid}/seats/{row:int}/{column:int}/block")]
    public async Task<IActionResult> BlockSeat(Guid examId, Guid hallId, int row, int column, CancellationToken cancellationToken) =>
        OkJson(await hallService.BlockSeatAsync(examId, hallId, row, column, cancellationToken));

    [HttpDelete("{hallId:guid}/seats/{row:int}/{column:int}/block")]
    public async Task<IActionResult> UnblockSeat(Guid examId, Guid hallId, int row, int column, CancellationToken cancellationToken) =>
        OkJson(await hallService.UnblockSeatAsync(examId, hallId, row, column, cancellationToken));

    [HttpDelete("{hallId:guid}")]
    public async Task<IActionResult> Delete(Guid examId, Guid hallId, CancellationToken cancellationToken)
    {
        await hallService.DeleteAsync(examId, hallId, cancellationToken);

        return NoContent();
    }
}
