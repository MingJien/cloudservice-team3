using System.ComponentModel.DataAnnotations;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Recommendations.Models;

public enum ServicePurpose
{
    Website = 1,
    Ecommerce = 2,
    BusinessApplication = 3,
    Development = 4,
    Email = 5,
    General = 6
}

public enum TrafficLevel
{
    Low = 1,
    Medium = 2,
    High = 3
}

public sealed record ServicePlanRecommendationRequest(
    [Range(0, 999_999_999_999d)] decimal Budget,
    [EnumDataType(typeof(BillingCycle))] BillingCycle BillingCycle,
    [EnumDataType(typeof(ServicePurpose))] ServicePurpose Purpose,
    [EnumDataType(typeof(TrafficLevel))] TrafficLevel Traffic,
    [Range(0, 1024)] int MinimumCpuCores = 0,
    [Range(0, 65536)] decimal MinimumRamGb = 0,
    [Range(0, int.MaxValue)] int MinimumStorageGb = 0,
    [Range(1, 3)] int MaxResults = 3);

public sealed record ServicePlanRecommendationResponse(
    IReadOnlyCollection<RecommendedPlan> Items,
    DateTime EvaluatedAtUtc);

public sealed record RecommendedPlan(
    int ServicePlanId,
    string PlanName,
    string PlanSlug,
    string CategoryName,
    int Score,
    BillingCycle BillingCycle,
    decimal Price,
    string Currency,
    IReadOnlyCollection<string> Reasons);

public sealed record RecommendationContext(
    ServicePlanRecommendationRequest Request,
    PlanCatalogItem Plan,
    PlanCatalogPrice Price);

public sealed record RecommendationRuleResult(int Score, string Reason);
