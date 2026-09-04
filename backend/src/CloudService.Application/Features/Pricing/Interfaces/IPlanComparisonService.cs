using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing.Interfaces;

public interface IPlanComparisonService
{
    Task<PlanComparisonResponse> CompareAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);
}
