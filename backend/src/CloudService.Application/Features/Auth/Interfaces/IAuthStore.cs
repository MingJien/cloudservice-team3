using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Auth.Interfaces;

public interface IAuthStore
{
    Task<AppUser?> FindUserForLoginAsync(string normalizedIdentifier, CancellationToken cancellationToken);
    Task<AppUser?> FindUserByIdAsync(int userId, CancellationToken cancellationToken);
    Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<RefreshToken>> GetActiveRefreshTokensAsync(int userId, DateTime utcNow, CancellationToken cancellationToken);
    void AddRefreshToken(RefreshToken refreshToken);
    void AddAuditLog(AuditLog auditLog);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
