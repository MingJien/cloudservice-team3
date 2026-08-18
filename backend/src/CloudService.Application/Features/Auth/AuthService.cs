using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Application.Features.Auth.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Auth;

public sealed class AuthService(
    IAuthStore authStore,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    TimeProvider timeProvider) : IAuthService
{
    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var identifier = request.UserNameOrEmail.Trim().ToUpperInvariant();
        var user = await authStore.FindUserForLoginAsync(identifier, cancellationToken);

        if (user is null || !user.IsActive || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            authStore.AddAuditLog(new AuditLog(
                "Auth.LoginFailed",
                user?.Id,
                nameof(AppUser),
                user?.Id.ToString(),
                newValues: JsonSerializer.Serialize(new { reason = "InvalidCredentials" }),
                ipAddress: ipAddress));
            await authStore.SaveChangesAsync(cancellationToken);
            throw new InvalidCredentialsException();
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        user.RecordSuccessfulLogin(utcNow);
        var response = IssueTokens(user, utcNow, ipAddress);
        authStore.AddAuditLog(new AuditLog("Auth.LoginSucceeded", user.Id, nameof(AppUser), user.Id.ToString(), ipAddress: ipAddress));
        await authStore.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var tokenHash = tokenService.HashRefreshToken(request.RefreshToken);
        var storedToken = await authStore.FindRefreshTokenAsync(tokenHash, cancellationToken);

        if (storedToken is null || !storedToken.User.IsActive)
        {
            authStore.AddAuditLog(new AuditLog("Auth.RefreshFailed", ipAddress: ipAddress));
            await authStore.SaveChangesAsync(cancellationToken);
            throw new InvalidRefreshTokenException();
        }

        if (!storedToken.IsActive(utcNow))
        {
            if (storedToken.RevokedAt is not null)
            {
                var activeTokens = await authStore.GetActiveRefreshTokensAsync(storedToken.UserId, utcNow, cancellationToken);
                foreach (var activeToken in activeTokens)
                {
                    activeToken.Revoke(utcNow);
                }

                authStore.AddAuditLog(new AuditLog("Auth.RefreshReuseDetected", storedToken.UserId, nameof(AppUser), storedToken.UserId.ToString(), ipAddress: ipAddress));
            }

            await authStore.SaveChangesAsync(cancellationToken);
            throw new InvalidRefreshTokenException();
        }

        var accessToken = tokenService.CreateAccessToken(storedToken.User, utcNow);
        var newRawRefreshToken = tokenService.GenerateRefreshToken();
        var newRefreshHash = tokenService.HashRefreshToken(newRawRefreshToken);
        var refreshExpiresAt = utcNow.Add(tokenService.RefreshTokenLifetime);

        storedToken.Revoke(utcNow, newRefreshHash);
        authStore.AddRefreshToken(new RefreshToken(storedToken.UserId, newRefreshHash, accessToken.JwtId, refreshExpiresAt, utcNow, ipAddress));
        authStore.AddAuditLog(new AuditLog("Auth.TokenRefreshed", storedToken.UserId, nameof(AppUser), storedToken.UserId.ToString(), ipAddress: ipAddress));
        await authStore.SaveChangesAsync(cancellationToken);

        return CreateResponse(storedToken.User, accessToken, newRawRefreshToken, refreshExpiresAt);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var user = await authStore.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            throw new InvalidCredentialsException();
        }

        if (!passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new RequestValidationException(nameof(request.CurrentPassword), "Mật khẩu hiện tại không đúng.");
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            throw new RequestValidationException(nameof(request.NewPassword), "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        user.ChangePasswordHash(passwordHasher.Hash(request.NewPassword), utcNow);
        var activeTokens = await authStore.GetActiveRefreshTokensAsync(userId, utcNow, cancellationToken);
        foreach (var activeToken in activeTokens)
        {
            activeToken.Revoke(utcNow);
        }

        authStore.AddAuditLog(new AuditLog("Auth.PasswordChanged", user.Id, nameof(AppUser), user.Id.ToString(), ipAddress: ipAddress));
        await authStore.SaveChangesAsync(cancellationToken);
    }

    private AuthResponse IssueTokens(AppUser user, DateTime utcNow, string? ipAddress)
    {
        var accessToken = tokenService.CreateAccessToken(user, utcNow);
        var rawRefreshToken = tokenService.GenerateRefreshToken();
        var refreshHash = tokenService.HashRefreshToken(rawRefreshToken);
        var refreshExpiresAt = utcNow.Add(tokenService.RefreshTokenLifetime);
        authStore.AddRefreshToken(new RefreshToken(user.Id, refreshHash, accessToken.JwtId, refreshExpiresAt, utcNow, ipAddress));
        return CreateResponse(user, accessToken, rawRefreshToken, refreshExpiresAt);
    }

    private static AuthResponse CreateResponse(AppUser user, AccessTokenResult accessToken, string refreshToken, DateTime refreshExpiresAt)
    {
        return new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAt,
            refreshToken,
            refreshExpiresAt,
            new AuthenticatedUser(user.Id, user.UserName, user.FullName, user.Email, user.Role.Name));
    }
}
