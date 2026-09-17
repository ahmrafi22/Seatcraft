namespace SeatCraft.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string hash);
}

public sealed record IssuedToken(string AccessToken, DateTimeOffset ExpiresAt);

public interface ITokenIssuer
{
    IssuedToken Issue(Guid userId, Guid tenantId, string email, string role, string displayName);
}
