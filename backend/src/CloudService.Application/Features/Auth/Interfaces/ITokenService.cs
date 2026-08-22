using CloudService.Application.Features.Auth.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Auth.Interfaces;

public interface ITokenService
{
    TimeSpan RefreshTokenLifetime { get; }
    AccessTokenResult CreateAccessToken(AppUser user, DateTime utcNow);
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
}
