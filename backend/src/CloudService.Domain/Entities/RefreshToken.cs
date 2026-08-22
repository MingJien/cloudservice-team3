namespace CloudService.Domain.Entities;

public sealed class RefreshToken
{
    private RefreshToken()
    {
    }

    public RefreshToken(int userId, string tokenHash, string jwtId, DateTime expiresAt, DateTime createdAt, string? createdByIp)
    {
        if (expiresAt <= createdAt)
        {
            throw new ArgumentException("Refresh token expiry must be after creation.", nameof(expiresAt));
        }

        UserId = userId > 0 ? userId : throw new ArgumentOutOfRangeException(nameof(userId));
        TokenHash = string.IsNullOrWhiteSpace(tokenHash) ? throw new ArgumentException("Token hash is required.", nameof(tokenHash)) : tokenHash;
        JwtId = string.IsNullOrWhiteSpace(jwtId) ? throw new ArgumentException("JWT id is required.", nameof(jwtId)) : jwtId;
        ExpiresAt = expiresAt;
        CreatedAt = createdAt;
        CreatedByIp = createdByIp;
    }

    public long Id { get; private set; }
    public int UserId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public string? JwtId { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public string? ReplacedByHash { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? CreatedByIp { get; private set; }
    public AppUser User { get; private set; } = null!;

    public bool IsActive(DateTime utcNow) => RevokedAt is null && ExpiresAt > utcNow;

    public void Revoke(DateTime utcNow, string? replacedByHash = null)
    {
        if (RevokedAt is not null)
        {
            return;
        }

        RevokedAt = utcNow;
        ReplacedByHash = replacedByHash;
    }
}
