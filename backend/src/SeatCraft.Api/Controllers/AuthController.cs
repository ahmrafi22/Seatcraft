using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Auth;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Controllers;

[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ApiControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken) =>
        OkJson(await authService.RegisterTenantAsync(request, cancellationToken));

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken) =>
        OkJson(await authService.LoginAsync(request, cancellationToken));

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() =>
        OkJson(new
        {
            id = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value,
            tenantId = User.FindFirst("tenant_id")?.Value,
            email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value,
            role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
            name = User.Identity?.Name
        });
}
