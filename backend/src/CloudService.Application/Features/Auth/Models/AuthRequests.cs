using System.ComponentModel.DataAnnotations;

namespace CloudService.Application.Features.Auth.Models;

public sealed record LoginRequest(
    [property: Required, StringLength(255, MinimumLength = 3)] string UserNameOrEmail,
    [property: Required, StringLength(128, MinimumLength = 8)] string Password);

public sealed record RefreshRequest(
    [property: Required, StringLength(512, MinimumLength = 32)] string RefreshToken);

public sealed record ChangePasswordRequest(
    [property: Required, StringLength(128, MinimumLength = 8)] string CurrentPassword,
    [property: Required, StringLength(128, MinimumLength = 12)] string NewPassword);
