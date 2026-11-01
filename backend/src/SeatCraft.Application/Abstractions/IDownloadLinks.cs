using SeatCraft.Application.Documents;

namespace SeatCraft.Application.Abstractions;

public sealed record DownloadLink(string Token, DateTimeOffset ExpiresAt);

public sealed record DownloadTicket(Guid TenantId, Guid ExamId, Guid PlanId, DocumentKind Kind);

/// <summary>
/// Issues signed, short-lived download links so the browser can stream a document
/// straight from the API instead of buffering it through the web tier.
/// </summary>
public interface IDownloadLinkIssuer
{
    DownloadLink Issue(Guid tenantId, Guid examId, Guid planId, DocumentKind kind);

    DownloadTicket? Read(string token);
}
