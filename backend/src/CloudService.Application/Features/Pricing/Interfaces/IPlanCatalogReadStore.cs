using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing.Interfaces;

public interface IPlanCatalogReadStore
{
    Task<PlanCatalogItem?> GetActivePlanAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PlanCatalogItem>> GetActivePlansByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PlanCatalogItem>> GetActivePlansAsync(CancellationToken cancellationToken);
    Task<PromotionCatalogItem?> FindPromotionAsync(string normalizedCode, CancellationToken cancellationToken);
    Task<bool> TryReservePromotionUseAsync(string normalizedCode, int servicePlanId, DateTime utcNow, CancellationToken cancellationToken);
}
