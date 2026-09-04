namespace CloudService.Application.Features.Auth.Interfaces;

public interface IAccessTokenRevocationStore
{
    bool IsRevoked(string jwtId, DateTime utcNow);
    void Revoke(string jwtId, DateTime expiresAtUtc);
}
