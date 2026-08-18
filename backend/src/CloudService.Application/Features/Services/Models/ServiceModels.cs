using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Services.Models;

public sealed record ServiceCategoryItem(int Id, string Name, string Slug, string? Description, string? Icon, int DisplayOrder, bool IsActive);

public sealed record PlanPriceItem(
    int Id,
    BillingCycle BillingCycle,
    decimal OriginalPrice,
    decimal? SalePrice,
    decimal EffectivePrice,
    string Currency,
    DateTime? EffectiveFrom,
    DateTime? EffectiveTo,
    bool IsActive);

public sealed record ServicePlanItem(
    int Id,
    int CategoryId,
    string CategoryName,
    string CategorySlug,
    string Name,
    string Slug,
    string? ShortDescription,
    string? Description,
    int? CpuCores,
    decimal? RamGb,
    int? StorageGb,
    string? StorageType,
    int? BandwidthGb,
    string? SpecificationsJson,
    string? QrTargetUrl,
    string? QrCodePath,
    DateTime? QrGeneratedAt,
    bool IsFeatured,
    int DisplayOrder,
    bool IsActive,
    IReadOnlyCollection<PlanPriceItem> Prices);

public sealed record PromotionItem(
    int Id,
    string Code,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTime StartAt,
    DateTime EndAt,
    int? UsageLimit,
    int UsedCount,
    bool IsActive,
    IReadOnlyCollection<int> ServicePlanIds);

public sealed record QrCodeResult(int ServicePlanId, string TargetUrl, string DataUrl, DateTime GeneratedAt);

public sealed class ServiceCategoryRequest
{
    [Required, StringLength(100)] public string Name { get; init; } = string.Empty;
    [Required, RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$"), StringLength(150)] public string Slug { get; init; } = string.Empty;
    [StringLength(500)] public string? Description { get; init; }
    [StringLength(100)] public string? Icon { get; init; }
    [Range(0, int.MaxValue)] public int DisplayOrder { get; init; }
}

public sealed class ServicePlanRequest
{
    [Range(1, int.MaxValue)] public int CategoryId { get; init; }
    [Required, StringLength(150)] public string Name { get; init; } = string.Empty;
    [Required, RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$"), StringLength(180)] public string Slug { get; init; } = string.Empty;
    [StringLength(500)] public string? ShortDescription { get; init; }
    public string? Description { get; init; }
    [Range(1, 256)] public int? CpuCores { get; init; }
    [Range(typeof(decimal), "0.01", "4096")] public decimal? RamGb { get; init; }
    [Range(1, int.MaxValue)] public int? StorageGb { get; init; }
    [StringLength(30)] public string? StorageType { get; init; }
    [Range(1, int.MaxValue)] public int? BandwidthGb { get; init; }
    public string? SpecificationsJson { get; init; }
    public bool IsFeatured { get; init; }
    [Range(0, int.MaxValue)] public int DisplayOrder { get; init; }
}

public sealed class PlanPriceRequest
{
    [Required] public BillingCycle BillingCycle { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999")] public decimal OriginalPrice { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999")] public decimal? SalePrice { get; init; }
    [StringLength(3, MinimumLength = 3)] public string Currency { get; init; } = "VND";
    public DateTime? EffectiveFrom { get; init; }
    public DateTime? EffectiveTo { get; init; }
}

public sealed class PromotionRequest
{
    [Required, StringLength(50)] public string Code { get; init; } = string.Empty;
    [Required, StringLength(150)] public string Name { get; init; } = string.Empty;
    [StringLength(1000)] public string? Description { get; init; }
    [Required] public DiscountType DiscountType { get; init; }
    [Range(typeof(decimal), "0.01", "9999999999999999")] public decimal DiscountValue { get; init; }
    public DateTime StartAt { get; init; }
    public DateTime EndAt { get; init; }
    [Range(1, int.MaxValue)] public int? UsageLimit { get; init; }
    public IReadOnlyCollection<int> ServicePlanIds { get; init; } = Array.Empty<int>();
}

public sealed record ServicePlanListQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    string? CategorySlug = null,
    bool IncludeInactive = false);

public sealed record ServiceCategoryListQuery(int PageNumber = 1, int PageSize = 20, bool IncludeInactive = false);

