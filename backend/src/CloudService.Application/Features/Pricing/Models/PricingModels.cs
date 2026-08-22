using System.ComponentModel.DataAnnotations;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing.Models;

public sealed record PricingQuoteRequest(
    [Range(1, int.MaxValue)] int ServicePlanId,
    [EnumDataType(typeof(BillingCycle))] BillingCycle BillingCycle,
    [StringLength(50)] string? PromotionCode);

public sealed record PricingQuoteResponse(
    int ServicePlanId,
    string PlanName,
    string PlanSlug,
    int PlanPriceId,
    BillingCycle BillingCycle,
    decimal OriginalPrice,
    decimal EffectivePlanPrice,
    decimal PlanDiscountAmount,
    decimal PromotionDiscountAmount,
    decimal TotalDiscountAmount,
    decimal TotalPrice,
    string Currency,
    AppliedPromotion? Promotion,
    DateTime CalculatedAtUtc);

public sealed record AppliedPromotion(string Code, string Name, DiscountType DiscountType, decimal DiscountValue);

public sealed record PlanComparisonResponse(IReadOnlyCollection<ComparedPlan> Plans, DateTime ComparedAtUtc);

public sealed record ComparedPlan(
    int Id,
    string Name,
    string Slug,
    string CategoryName,
    string? ShortDescription,
    int? CpuCores,
    decimal? RamGb,
    int? StorageGb,
    string? StorageType,
    int? BandwidthGb,
    IReadOnlyDictionary<string, string> Specifications,
    IReadOnlyCollection<ComparedPlanPrice> Prices);

public sealed record ComparedPlanPrice(
    int PlanPriceId,
    BillingCycle BillingCycle,
    decimal OriginalPrice,
    decimal? SalePrice,
    decimal EffectivePrice,
    string Currency);
