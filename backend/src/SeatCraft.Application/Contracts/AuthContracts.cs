namespace SeatCraft.Application.Contracts;

public sealed record TenantDto(Guid Id, string Name, string Slug);

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserDto User);

public sealed record UserDto(Guid Id, Guid TenantId, string Email, string DisplayName, string Role);

public sealed record LoginRequest(string Email, string Password);

public sealed record RegisterRequest(string TenantName, string TenantSlug, string Email, string Password, string DisplayName);
