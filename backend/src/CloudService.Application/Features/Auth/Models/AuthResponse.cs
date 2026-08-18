namespace CloudService.Application.Features.Auth.Models;

public sealed record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    AuthenticatedUser User);

public sealed record AuthenticatedUser(int Id, string UserName, string FullName, string Email, string Role);

public sealed record AccessTokenResult(string Token, string JwtId, DateTime ExpiresAt);
