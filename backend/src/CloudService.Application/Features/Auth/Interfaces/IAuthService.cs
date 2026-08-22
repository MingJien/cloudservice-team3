using CloudService.Application.Features.Auth.Models;

namespace CloudService.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, string? ipAddress, CancellationToken cancellationToken);
}
