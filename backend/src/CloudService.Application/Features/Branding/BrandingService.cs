using System.Text.Json;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Branding.Interfaces;
using CloudService.Application.Features.Branding.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Branding;

public sealed class BrandingService(
    IBrandingRepository repository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IBrandingService
{
    private const string DefaultBrandName = "MekongNode";

    public async Task<BrandingItem> GetAsync(CancellationToken cancellationToken)
    {
        var branding = await repository.GetAsync(cancellationToken);
        return branding is null
            ? new BrandingItem(DefaultBrandName, null, null)
            : Map(branding);
    }

    public async Task<BrandingItem> UpdateLogoAsync(string? logoUrl, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var branding = await repository.GetAsync(cancellationToken);
        if (branding is null)
        {
            branding = new SiteBranding(DefaultBrandName);
            repository.Add(branding);
        }

        var now = timeProvider.GetUtcNow().UtcDateTime;
        branding.UpdateLogo(logoUrl, now);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        unitOfWork.AddAuditLog(new AuditLog(
            string.IsNullOrWhiteSpace(logoUrl) ? "Branding.LogoReset" : "Branding.LogoUpdated",
            userId,
            nameof(SiteBranding),
            branding.Id.ToString(),
            newValues: JsonSerializer.Serialize(new { branding.LogoUrl }),
            ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(branding);
    }

    private static BrandingItem Map(SiteBranding branding) =>
        new(branding.BrandName, branding.LogoUrl, branding.UpdatedAt);
}
