using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Contracts;
using SeatCraft.Application.Institutions;

namespace SeatCraft.Api.Controllers;

[Route("api/institutions")]
[Authorize]
public sealed class InstitutionsController(InstitutionService institutionService) : ApiControllerBase
{
    [HttpGet]
    public IActionResult List() => OkJson(institutionService.List());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstitutionRequest request, CancellationToken cancellationToken) =>
        OkJson(await institutionService.CreateAsync(request, cancellationToken));

    [HttpDelete("{institutionId:guid}")]
    public async Task<IActionResult> Delete(Guid institutionId, CancellationToken cancellationToken)
    {
        await institutionService.DeleteAsync(institutionId, cancellationToken);

        return NoContent();
    }
}
