using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.Features.Auth.Models;

public sealed record LoginRequest(
    [Required, StringLength(255, MinimumLength = 3)] string UserNameOrEmail,
    [Required, StringLength(128, MinimumLength = 5)] string Password);

public sealed record RefreshRequest(
    [Required, StringLength(512, MinimumLength = 32)] string RefreshToken);

public sealed record ChangePasswordRequest(
    [Required, StringLength(128, MinimumLength = 5)] string CurrentPassword,
    [Required, StringLength(128, MinimumLength = 12)] string NewPassword);

public sealed record LogoutRequest(
    [Required, StringLength(512, MinimumLength = 32)] string RefreshToken);
