using CloudService.Application.Features.Branding.Interfaces;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class BrandingRepository(ApplicationDbContext dbContext) : IBrandingRepository
{
    public Task<SiteBranding?> GetAsync(CancellationToken cancellationToken) =>
        dbContext.SiteBranding.SingleOrDefaultAsync(cancellationToken);

    public void Add(SiteBranding branding) => dbContext.SiteBranding.Add(branding);
}
