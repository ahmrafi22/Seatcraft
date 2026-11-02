using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Seed;

namespace SeatCraft.Api.Controllers;

/// <summary>
/// Builds a demo workspace in one call.
///
/// Allowed in Development/Testing by default. In any other environment it needs
/// an explicit opt-in (<c>DemoSeed__Enabled=true</c>), because it writes a lot of
/// rows; the host that serves the public demo sets that flag deliberately.
/// Admin-only either way.
/// </summary>
[Route("api/dev/seed-demo")]
[Authorize(Roles = "Admin")]
public sealed class DevSeedController(
    DemoSeedService seedService,
    IWebHostEnvironment environment,
    IConfiguration configuration) : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Seed(
        [FromQuery] int candidates = 500,
        [FromQuery] int institutions = 20,
        [FromQuery] int halls = 12,
        CancellationToken cancellationToken = default)
    {
        if (!IsEnabled())
            return NotFound();

        var result = await seedService.SeedAsync(
            candidateCount: Math.Clamp(candidates, 1, 5000),
            institutionCount: Math.Clamp(institutions, 1, 100),
            hallCount: Math.Clamp(halls, 1, 50),
            cancellationToken: cancellationToken);

        return OkJson(result);
    }

    private bool IsEnabled() =>
        environment.IsDevelopment()
        || environment.IsEnvironment("Testing")
        || configuration.GetValue<bool>("DemoSeed:Enabled");
}
