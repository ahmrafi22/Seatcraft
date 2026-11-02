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

    /// <summary>
    /// Renames a college and/or changes its code. The code is what CSV imports
    /// match on, so it is normalised the same way <see cref="Create"/> does.
    /// </summary>
    public void Update(string name, string code)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Institution name is required.");

        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Institution code is required.");

        Name = name.Trim();
        Code = code.Trim().ToUpperInvariant();
    }

    public void SetCandidateCount(int count)
    {
        if (count < 0)
            throw new DomainException("Candidate count cannot be negative.");

        CandidateCount = count;
    }
}
