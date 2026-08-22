using CloudService.Application.Features.Branding.Models;

namespace CloudService.Application.Features.Branding.Interfaces;

public interface IBrandingService
{
    Task<BrandingItem> GetAsync(CancellationToken cancellationToken);
    Task<BrandingItem> UpdateLogoAsync(string? logoUrl, int userId, string? ipAddress, CancellationToken cancellationToken);
}
