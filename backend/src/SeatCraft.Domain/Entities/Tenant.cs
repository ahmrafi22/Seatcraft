using SeatCraft.Domain.Common;

namespace SeatCraft.Domain.Entities;

public sealed class Tenant : Entity
{
    private Tenant() { }

    public Tenant(string name, string slug)
    {
        Name = string.IsNullOrWhiteSpace(name) ? throw new DomainException("Tenant name is required.") : name.Trim();
        Slug = string.IsNullOrWhiteSpace(slug) ? throw new DomainException("Tenant slug is required.") : slug.Trim().ToLowerInvariant();
    }

    public string Name { get; private set; } = string.Empty;

    public string Slug { get; private set; } = string.Empty;
}
