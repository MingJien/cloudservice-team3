using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Rules;

public sealed class PurposeRecommendationRule : IRecommendationRule
{
    public RecommendationRuleResult Evaluate(RecommendationContext context)
    {
        var acceptedCategories = context.Request.Purpose switch
        {
            ServicePurpose.Website => new[] { "hosting", "vps" },
            ServicePurpose.Ecommerce => new[] { "vps", "hosting" },
            ServicePurpose.BusinessApplication => new[] { "vps" },
            ServicePurpose.Development => new[] { "vps", "hosting" },
            ServicePurpose.Email => new[] { "business-email" },
            ServicePurpose.General => Array.Empty<string>(),
            _ => Array.Empty<string>()
        };

        if (acceptedCategories.Length == 0 || acceptedCategories.Contains(context.Plan.CategorySlug, StringComparer.OrdinalIgnoreCase))
        {
            return new RecommendationRuleResult(20, $"Nhóm dịch vụ {context.Plan.CategoryName} phù hợp mục đích sử dụng đã chọn.");
        }

        return new RecommendationRuleResult(5, $"Nhóm dịch vụ {context.Plan.CategoryName} không phải lựa chọn ưu tiên cho mục đích đã chọn.");
    }
}
