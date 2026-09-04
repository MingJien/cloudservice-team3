using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class SiteBranding : AuditableEntity
{
    private SiteBranding()
    {
    }

    public SiteBranding(string brandName)
    {
        BrandName = Guard.Required(brandName, nameof(brandName));
    }

    public string BrandName { get; private set; } = string.Empty;
    public string? LogoUrl { get; private set; }

    public void UpdateLogo(string? logoUrl, DateTime utcNow)
    {
        LogoUrl = string.IsNullOrWhiteSpace(logoUrl) ? null : logoUrl.Trim();
        MarkUpdated(utcNow);
    }
}
