using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Seed;

namespace SeatCraft.Api.Controllers;

/// <summary>Development helper that builds a demo exam in one call.</summary>
[Route("api/dev/seed-demo")]
[Authorize(Roles = "Admin")]
public sealed class DevSeedController(DemoSeedService seedService, IWebHostEnvironment environment) : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Seed(
        [FromQuery] int candidates = 500,
        [FromQuery] int institutions = 20,
        [FromQuery] int halls = 12,
        CancellationToken cancellationToken = default)
    {
        if (!environment.IsDevelopment() && !environment.IsEnvironment("Testing"))
            return NotFound();

        var result = await seedService.SeedAsync(
            candidateCount: Math.Clamp(candidates, 1, 5000),
            institutionCount: Math.Clamp(institutions, 1, 100),
            hallCount: Math.Clamp(halls, 1, 50),
            cancellationToken: cancellationToken);

        return OkJson(result);
    }
}
