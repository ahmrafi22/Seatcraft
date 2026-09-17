using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;
using SeatCraft.Domain.Enums;

namespace SeatCraft.Application.Auth;

/// <summary>
/// Authentication happens before a tenant exists in the request, so these queries
/// deliberately bypass the tenant filter and then resolve the tenant themselves.
/// </summary>
public sealed class AuthService(ISeatCraftData data, IUnitOfWork unitOfWork, IPasswordHasher hasher, ITokenIssuer tokenIssuer)
{
    public async Task<AuthResponse> RegisterTenantAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var slug = request.TenantSlug.Trim().ToLowerInvariant();
        var email = request.Email.Trim().ToLowerInvariant();

        if (data.Tenants.QueryUnfiltered().Any(tenant => tenant.Slug == slug))
            throw new ConflictException($"Tenant slug '{slug}' is already taken.");

        if (data.Users.QueryUnfiltered().Any(user => user.Email == email))
            throw new ConflictException("An account with that email already exists.");

        var tenant = new Tenant(request.TenantName, slug);
        var user = AppUser.Create(tenant.Id, email, hasher.Hash(request.Password), request.DisplayName, UserRole.Admin);

        await data.Tenants.AddAsync(tenant, cancellationToken);
        await data.Users.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return BuildResponse(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = data.Users.QueryUnfiltered().FirstOrDefault(candidate => candidate.Email == email);

        if (user is null || !user.IsActive || !hasher.Verify(request.Password, user.PasswordHash))
            throw new NotFoundException("Invalid email or password.");

        await Task.CompletedTask;

        return BuildResponse(user);
    }

    public static UserDto ToDto(AppUser user) =>
        new(user.Id, user.TenantId, user.Email, user.DisplayName, user.Role.ToString());

    private AuthResponse BuildResponse(AppUser user)
    {
        var token = tokenIssuer.Issue(user.Id, user.TenantId, user.Email, user.Role.ToString(), user.DisplayName);

        return new AuthResponse(token.AccessToken, token.ExpiresAt, ToDto(user));
    }
}
