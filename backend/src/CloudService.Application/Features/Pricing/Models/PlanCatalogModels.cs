using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing.Models;

public sealed record PlanCatalogItem(
    int Id,
    string Name,
    string Slug,
    string CategoryName,
    string CategorySlug,
    string? ShortDescription,
    int? CpuCores,
    decimal? RamGb,
    int? StorageGb,
    string? StorageType,
    int? BandwidthGb,
    string? SpecificationsJson,
    IReadOnlyCollection<PlanCatalogPrice> Prices);

public sealed record PlanCatalogPrice(
    int Id,
    BillingCycle BillingCycle,
    decimal OriginalPrice,
    decimal? SalePrice,
    string Currency,
    DateTime? EffectiveFrom,
    DateTime? EffectiveTo);

public sealed record PromotionCatalogItem(
    int Id,
    string Code,
    string Name,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTime StartAt,
    DateTime EndAt,
    int? UsageLimit,
    int UsedCount,
    bool IsActive,
    IReadOnlyCollection<int> ServicePlanIds);
