using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class ServicePlan : AuditableEntity
{
    private ServicePlan()
    {
    }

    public ServicePlan(int categoryId, string name, string slug, int displayOrder = 0)
    {
        CategoryId = categoryId > 0 ? categoryId : throw new ArgumentOutOfRangeException(nameof(categoryId));
        Name = Guard.Required(name, nameof(name));
        Slug = Guard.Required(slug, nameof(slug));
        DisplayOrder = displayOrder >= 0 ? displayOrder : throw new ArgumentOutOfRangeException(nameof(displayOrder));
    }

    public int CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? ShortDescription { get; private set; }
    public string? Description { get; private set; }
    public int? CpuCores { get; private set; }
    public decimal? RamGb { get; private set; }
    public int? StorageGb { get; private set; }
    public string? StorageType { get; private set; }
    public int? BandwidthGb { get; private set; }
    public string? SpecificationsJson { get; private set; }
    public string? QrTargetUrl { get; private set; }
    public string? QrCodePath { get; private set; }
    public DateTime? QrGeneratedAt { get; private set; }
    public bool IsFeatured { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public ServiceCategory Category { get; private set; } = null!;
    public ICollection<PlanPrice> Prices { get; private set; } = new List<PlanPrice>();
    public ICollection<PromotionServicePlan> PromotionServicePlans { get; private set; } = new List<PromotionServicePlan>();
    public ICollection<OrderRequest> OrderRequests { get; private set; } = new List<OrderRequest>();
}
