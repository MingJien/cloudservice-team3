using System.Security.Claims;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Application.Features.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CloudService.Domain.Constants;
using CloudService.WebApi.Infrastructure;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController(IAuthStore authStore, TimeProvider timeProvider, IWebHostEnvironment environment) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AuthenticatedUser>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthenticatedUser>> GetCurrentProfile(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        {
            return Unauthorized();
        }

        var user = await authStore.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        return Ok(new AuthenticatedUser(user.Id, user.UserName, user.FullName, user.Email, user.Role.Name, user.AvatarUrl, user.MustChangePassword));
    }

    [HttpPut]
    [ProducesResponseType<AuthenticatedUser>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        {
            return Unauthorized();
        }

        var user = await authStore.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        if (await authStore.CheckEmailExistsAsync(request.Email, userId, cancellationToken))
        {
            return BadRequest(new ProblemDetails { Title = "Email này đã được sử dụng bởi tài khoản khác." });
        }

        user.UpdateProfile(request.FullName, request.Email, timeProvider.GetUtcNow().UtcDateTime);
        await authStore.SaveChangesAsync(cancellationToken);

        return Ok(new AuthenticatedUser(user.Id, user.UserName, user.FullName, user.Email, user.Role.Name, user.AvatarUrl, user.MustChangePassword));
    }

    [HttpPost("avatar")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken cancellationToken)
    {
        var validation = await ImageUploadValidator.ValidateAsync(file, 5 * 1024 * 1024, "Ảnh đại diện", cancellationToken);
        if (validation.Error is not null)
            return BadRequest(new ProblemDetails { Title = validation.Error });
        var extension = validation.Extension!;

        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
        {
            return Unauthorized();
        }

        var user = await authStore.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "avatars");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"user_{userId}_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        await using (var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var previousAvatarUrl = user.AvatarUrl;
        var avatarUrl = $"/avatars/{uniqueFileName}";
        try
        {
            user.UpdateAvatarUrl(avatarUrl, timeProvider.GetUtcNow().UtcDateTime);
            await authStore.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            System.IO.File.Delete(filePath);
            throw;
        }

        if (!string.IsNullOrWhiteSpace(previousAvatarUrl))
        {
            var oldFilePath = Path.Combine(uploadsFolder, Path.GetFileName(previousAvatarUrl));
            if (System.IO.File.Exists(oldFilePath)) System.IO.File.Delete(oldFilePath);
        }

        return Ok(new { avatarUrl });
    }
}
