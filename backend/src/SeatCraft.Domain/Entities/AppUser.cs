using SeatCraft.Domain.Common;
using SeatCraft.Domain.Enums;

namespace SeatCraft.Domain.Entities;

public sealed class AppUser : TenantEntity
{
    private AppUser() { }

    public static AppUser Create(Guid tenantId, string email, string passwordHash, string displayName, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException("Email is required.");

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException("Password hash is required.");

        return new AppUser
        {
            TenantId = tenantId,
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHash,
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? email.Trim() : displayName.Trim(),
            Role = role
        };
    }

    public string Email { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public UserRole Role { get; private set; }

    public bool IsActive { get; private set; } = true;

    public void Deactivate() => IsActive = false;

    public void ChangePassword(string passwordHash)
    {
        PasswordHash = string.IsNullOrWhiteSpace(passwordHash)
            ? throw new DomainException("Password hash is required.")
            : passwordHash;
        Touch();
    }
}
