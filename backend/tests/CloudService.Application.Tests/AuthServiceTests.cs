using System.Reflection;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Auth;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Application.Features.Auth.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class AuthServiceTests
{
    private static readonly DateTime UtcNow = new(2026, 1, 1, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Login_with_invalid_credentials_writes_safe_audit_and_throws()
    {
        var fixture = new Fixture();
        fixture.Store.Setup(x => x.FindUserForLoginAsync("UNKNOWN", It.IsAny<CancellationToken>())).ReturnsAsync((AppUser?)null);

        await Assert.ThrowsAsync<InvalidCredentialsException>(() =>
            fixture.Service.LoginAsync(new LoginRequest("unknown", "wrong-password"), "127.0.0.1", CancellationToken.None));

        fixture.Store.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log =>
            log.Action == "Auth.LoginFailed" && log.OldValues == null && log.NewValues != null)), Times.Once);
        fixture.Store.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_with_valid_credentials_issues_access_and_hashed_refresh_token()
    {
        var fixture = new Fixture();
        var user = CreateUser();
        fixture.Store.Setup(x => x.FindUserForLoginAsync("ADMIN", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        fixture.Passwords.Setup(x => x.Verify("valid-password", user.PasswordHash)).Returns(true);
        fixture.Tokens.Setup(x => x.CreateAccessToken(user, UtcNow)).Returns(new AccessTokenResult("access-token", "jwt-id", UtcNow.AddMinutes(15)));
        fixture.Tokens.Setup(x => x.GenerateRefreshToken()).Returns("raw-refresh-token");
        fixture.Tokens.Setup(x => x.HashRefreshToken("raw-refresh-token")).Returns(new string('A', 128));

        var response = await fixture.Service.LoginAsync(new LoginRequest("admin", "valid-password"), "127.0.0.1", CancellationToken.None);

        Assert.Equal("access-token", response.AccessToken);
        Assert.Equal("raw-refresh-token", response.RefreshToken);
        Assert.Equal("Admin", response.User.Role);
        Assert.Equal(UtcNow, user.LastLoginAt);
        fixture.Store.Verify(x => x.AddRefreshToken(It.Is<RefreshToken>(token => token.TokenHash == new string('A', 128))), Times.Once);
    }

    [Fact]
    public async Task Refresh_rotates_and_revokes_previous_token()
    {
        var fixture = new Fixture();
        var user = CreateUser();
        var oldToken = new RefreshToken(user.Id, new string('A', 128), "old-jwt", UtcNow.AddDays(1), UtcNow.AddHours(-1), "127.0.0.1");
        SetProperty(oldToken, nameof(RefreshToken.User), user);
        fixture.Tokens.Setup(x => x.HashRefreshToken("old-raw-token")).Returns(oldToken.TokenHash);
        fixture.Store.Setup(x => x.FindRefreshTokenAsync(oldToken.TokenHash, It.IsAny<CancellationToken>())).ReturnsAsync(oldToken);
        fixture.Tokens.Setup(x => x.CreateAccessToken(user, UtcNow)).Returns(new AccessTokenResult("new-access", "new-jwt", UtcNow.AddMinutes(15)));
        fixture.Tokens.Setup(x => x.GenerateRefreshToken()).Returns("new-raw-token");
        fixture.Tokens.Setup(x => x.HashRefreshToken("new-raw-token")).Returns(new string('B', 128));

        var response = await fixture.Service.RefreshAsync(new RefreshRequest("old-raw-token"), "127.0.0.1", CancellationToken.None);

        Assert.Equal("new-raw-token", response.RefreshToken);
        Assert.Equal(UtcNow, oldToken.RevokedAt);
        Assert.Equal(new string('B', 128), oldToken.ReplacedByHash);
    }

    [Fact]
    public async Task Change_password_hashes_new_password_and_revokes_active_sessions()
    {
        var fixture = new Fixture();
        var user = CreateUser();
        var activeToken = new RefreshToken(user.Id, new string('A', 128), "jwt", UtcNow.AddDays(1), UtcNow.AddHours(-1), null);
        fixture.Store.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        fixture.Passwords.Setup(x => x.Verify("current-password", user.PasswordHash)).Returns(true);
        fixture.Passwords.Setup(x => x.Hash("a-new-secure-password")).Returns("new-password-hash");
        fixture.Store.Setup(x => x.GetActiveRefreshTokensAsync(user.Id, UtcNow, It.IsAny<CancellationToken>())).ReturnsAsync([activeToken]);

        await fixture.Service.ChangePasswordAsync(user.Id, new ChangePasswordRequest("current-password", "a-new-secure-password"), null, CancellationToken.None);

        Assert.Equal("new-password-hash", user.PasswordHash);
        Assert.Equal(UtcNow, activeToken.RevokedAt);
        fixture.Store.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.PasswordChanged")), Times.Once);
    }

    private static AppUser CreateUser()
    {
        var role = new Role("Admin");
        var user = new AppUser("admin", "Admin Demo", "admin@example.local", "stored-hash", 1);
        typeof(BaseEntity).GetProperty(nameof(BaseEntity.Id))!.SetValue(user, 1);
        SetProperty(user, nameof(AppUser.Role), role);
        return user;
    }

    private static void SetProperty<T>(T target, string propertyName, object value)
    {
        typeof(T).GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!.SetValue(target, value);
    }

    private sealed class Fixture
    {
        public Fixture()
        {
            Tokens.SetupGet(x => x.RefreshTokenLifetime).Returns(TimeSpan.FromDays(7));
            Service = new AuthService(Store.Object, Passwords.Object, Tokens.Object, new FixedTimeProvider(UtcNow));
        }

        public Mock<IAuthStore> Store { get; } = new();
        public Mock<IPasswordHasher> Passwords { get; } = new();
        public Mock<ITokenService> Tokens { get; } = new();
        public AuthService Service { get; }
    }

    private sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow);
    }
}
