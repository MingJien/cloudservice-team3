using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class AuthStore(ApplicationDbContext dbContext) : IAuthStore
{
    public Task<AppUser?> FindUserForLoginAsync(string normalizedIdentifier, CancellationToken cancellationToken)
    {
        return dbContext.AppUsers
            .Include(user => user.Role)
            .SingleOrDefaultAsync(
                user => user.UserName.ToUpper() == normalizedIdentifier || user.Email.ToUpper() == normalizedIdentifier,
                cancellationToken);
    }

    public Task<AppUser?> FindUserByIdAsync(int userId, CancellationToken cancellationToken)
    {
        return dbContext.AppUsers
            .Include(user => user.Role)
            .SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);
    }

    public Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken)
    {
        return dbContext.RefreshTokens
            .Include(token => token.User)
            .ThenInclude(user => user.Role)
            .SingleOrDefaultAsync(token => token.TokenHash == tokenHash, cancellationToken);
    }

    public async Task<IReadOnlyCollection<RefreshToken>> GetActiveRefreshTokensAsync(int userId, DateTime utcNow, CancellationToken cancellationToken)
    {
        return await dbContext.RefreshTokens
            .Where(token => token.UserId == userId && token.RevokedAt == null && token.ExpiresAt > utcNow)
            .ToArrayAsync(cancellationToken);
    }

    public void AddRefreshToken(RefreshToken refreshToken) => dbContext.RefreshTokens.Add(refreshToken);

    public void AddAuditLog(AuditLog auditLog) => dbContext.AuditLogs.Add(auditLog);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
