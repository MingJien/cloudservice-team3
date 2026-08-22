using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Interfaces;

public interface IRecommendationRule
{
    RecommendationRuleResult Evaluate(RecommendationContext context);
}
