using SeatCraft.Domain.Common;

namespace SeatCraft.Domain.Entities;

public sealed class Candidate : TenantEntity
{
    private Candidate() { }

    public static Candidate Create(
        Guid tenantId,
        Guid examId,
        Guid institutionId,
        string roll,
        string fullName,
        string subjectGroup,
        DateOnly? dateOfBirth = null,
        string? photoUrl = null)
    {
        if (string.IsNullOrWhiteSpace(roll))
            throw new DomainException("Candidate roll is required.");

        if (string.IsNullOrWhiteSpace(fullName))
            throw new DomainException("Candidate name is required.");

        return new Candidate
        {
            TenantId = tenantId,
            ExamId = examId,
            InstitutionId = institutionId,
            Roll = roll.Trim(),
            FullName = fullName.Trim(),
            SubjectGroup = string.IsNullOrWhiteSpace(subjectGroup) ? "General" : subjectGroup.Trim(),
            DateOfBirth = dateOfBirth,
            PhotoUrl = photoUrl
        };
    }

    public Guid ExamId { get; private set; }

    public Guid InstitutionId { get; private set; }

    public string Roll { get; private set; } = string.Empty;

    public string FullName { get; private set; } = string.Empty;

    public string SubjectGroup { get; private set; } = "General";

    /// <summary>Second factor for the public seat lookup; never exposed in list responses.</summary>
    public DateOnly? DateOfBirth { get; private set; }

    public string? PhotoUrl { get; private set; }

    /// <summary>Optional pin that survives re-allocation (e.g. accessibility request).</summary>
    public bool IsSeatLocked { get; private set; }

    public void Update(string fullName, string subjectGroup, string? photoUrl)
    {
        FullName = string.IsNullOrWhiteSpace(fullName) ? FullName : fullName.Trim();
        SubjectGroup = string.IsNullOrWhiteSpace(subjectGroup) ? SubjectGroup : subjectGroup.Trim();
        PhotoUrl = photoUrl;
        Touch();
    }

    public void LockSeat() => IsSeatLocked = true;

    public void UnlockSeat() => IsSeatLocked = false;
}
