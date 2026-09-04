using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Branding.Interfaces;

public interface IBrandingRepository
{
    Task<SiteBranding?> GetAsync(CancellationToken cancellationToken);
    void Add(SiteBranding branding);
}
