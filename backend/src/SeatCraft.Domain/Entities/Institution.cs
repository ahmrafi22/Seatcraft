using SeatCraft.Domain.Common;

namespace SeatCraft.Domain.Entities;

public sealed class Institution : TenantEntity
{
    private Institution() { }

    public static Institution Create(Guid tenantId, string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Institution name is required.");

        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Institution code is required.");

        return new Institution
        {
            TenantId = tenantId,
            Name = name.Trim(),
            Code = code.Trim().ToUpperInvariant()
        };
    }

    public string Name { get; private set; } = string.Empty;

    public string Code { get; private set; } = string.Empty;

    public int CandidateCount { get; private set; }

    public void SetCandidateCount(int count)
    {
        if (count < 0)
            throw new DomainException("Candidate count cannot be negative.");

        CandidateCount = count;
    }
}
