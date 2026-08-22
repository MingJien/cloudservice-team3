using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Interfaces;

public interface IServicePlanRecommendationService
{
    Task<ServicePlanRecommendationResponse> RecommendAsync(
        ServicePlanRecommendationRequest request,
        CancellationToken cancellationToken);
}
