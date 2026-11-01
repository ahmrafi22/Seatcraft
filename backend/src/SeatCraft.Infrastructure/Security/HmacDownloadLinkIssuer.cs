using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Documents;

namespace SeatCraft.Infrastructure.Security;

/// <summary>
/// HMAC-signed download tokens: <c>base64url(payload).base64url(signature)</c>.
/// The key is the JWT signing key, so there is one secret to rotate.
/// </summary>
public sealed class HmacDownloadLinkIssuer : IDownloadLinkIssuer
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);
    private readonly byte[] _key;

    public HmacDownloadLinkIssuer(IConfiguration configuration, IClock clock)
    {
        var signingKey = configuration["Jwt:SigningKey"];

        if (string.IsNullOrWhiteSpace(signingKey))
            signingKey = "development-only-signing-key-change-me-please-32+";

        _key = Encoding.UTF8.GetBytes(signingKey);
        Clock = clock;
    }

    private IClock Clock { get; }

    public DownloadLink Issue(Guid tenantId, Guid examId, Guid planId, DocumentKind kind)
    {
        var expiresAt = Clock.UtcNow.Add(Lifetime);
        var payload = $"{expiresAt.ToUnixTimeSeconds()}|{tenantId:N}|{examId:N}|{planId:N}|{kind}";
        var encoded = Encode(Encoding.UTF8.GetBytes(payload));

        return new DownloadLink($"{encoded}.{Sign(encoded)}", expiresAt);
    }

    public DownloadTicket? Read(string token)
    {
        var parts = token.Split('.');

        if (parts.Length != 2)
            return null;

        var expected = Encoding.ASCII.GetBytes(Sign(parts[0]));
        var provided = Encoding.ASCII.GetBytes(parts[1]);

        if (expected.Length != provided.Length || !CryptographicOperations.FixedTimeEquals(expected, provided))
            return null;

        var fields = Encoding.UTF8.GetString(Decode(parts[0])).Split('|');

        if (fields.Length != 5 || !long.TryParse(fields[0], out var expires))
            return null;

        if (DateTimeOffset.FromUnixTimeSeconds(expires) <= Clock.UtcNow)
            return null;

        if (!Guid.TryParseExact(fields[1], "N", out var tenantId) ||
            !Guid.TryParseExact(fields[2], "N", out var examId) ||
            !Guid.TryParseExact(fields[3], "N", out var planId) ||
            !Enum.TryParse<DocumentKind>(fields[4], out var kind))
            return null;

        return new DownloadTicket(tenantId, examId, planId, kind);
    }

    private string Sign(string payload)
    {
        var signature = HMACSHA256.HashData(_key, Encoding.UTF8.GetBytes(payload));
        return Base64Url(signature);
    }

    private static string Encode(byte[] bytes) => Base64Url(bytes);

    private static byte[] Decode(string value) =>
        Convert.FromBase64String(value.Replace('-', '+').Replace('_', '/').PadRight((value.Length + 3) / 4 * 4, '='));

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
