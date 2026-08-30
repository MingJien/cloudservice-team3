using System.Security.Claims;
using CloudService.Application.Features.Branding.Interfaces;
using CloudService.Application.Features.Branding.Models;
using CloudService.Domain.Constants;
using CloudService.WebApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/branding")]
public sealed class BrandingController(
    IBrandingService service,
    IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxLogoBytes = 2 * 1024 * 1024;

    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType<BrandingItem>(StatusCodes.Status200OK)]
    public Task<BrandingItem> Get(CancellationToken cancellationToken) =>
        service.GetAsync(cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("logo")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<BrandingItem>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BrandingItem>> UploadLogo(IFormFile file, CancellationToken cancellationToken)
    {
        var validation = await ImageUploadValidator.ValidateAsync(file, MaxLogoBytes, "Logo", cancellationToken);
        if (validation.Error is not null)
            return BadRequest(new ProblemDetails { Title = validation.Error });

        var extension = validation.Extension!;
        var uploadsFolder = BrandingFolder();
        Directory.CreateDirectory(uploadsFolder);
        var fileName = $"logo_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, fileName);
        await using (var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var previous = await service.GetAsync(cancellationToken);
        try
        {
            var updated = await service.UpdateLogoAsync($"/branding/{fileName}", UserId(), ClientIp(), cancellationToken);
            DeleteManagedLogo(previous.LogoUrl);
            return Ok(updated);
        }
        catch
        {
            System.IO.File.Delete(filePath);
            throw;
        }
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("logo")]
    [ProducesResponseType<BrandingItem>(StatusCodes.Status200OK)]
    public async Task<ActionResult<BrandingItem>> ResetLogo(CancellationToken cancellationToken)
    {
        var previous = await service.GetAsync(cancellationToken);
        var updated = await service.UpdateLogoAsync(null, UserId(), ClientIp(), cancellationToken);
        DeleteManagedLogo(previous.LogoUrl);
        return Ok(updated);
    }

    private string BrandingFolder()
    {
        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        return Path.Combine(webRoot, "branding");
    }

    private void DeleteManagedLogo(string? logoUrl)
    {
        if (string.IsNullOrWhiteSpace(logoUrl) || !logoUrl.StartsWith("/branding/", StringComparison.OrdinalIgnoreCase)) return;
        var path = Path.Combine(BrandingFolder(), Path.GetFileName(logoUrl));
        if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string? ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
