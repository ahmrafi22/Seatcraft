namespace SeatCraft.Infrastructure.Persistence;

/// <summary>
/// Holds the tenant for the current request. Set by middleware from the JWT claim,
/// never from the request body, so a caller cannot read another tenant's data.
/// </summary>
public sealed class TenantContext
{
    public Guid? TenantId { get; private set; }

    public bool IsResolved => TenantId.HasValue;

    public void Set(Guid tenantId) => TenantId = tenantId;
}
