using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class PlanCatalogReadStore(ApplicationDbContext dbContext) : IPlanCatalogReadStore
{
    public async Task<PlanCatalogItem?> GetActivePlanAsync(int id, CancellationToken cancellationToken)
    {
        var plan = await BasePlanQuery()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return plan is null ? null : MapPlan(plan);
    }

    public async Task<IReadOnlyCollection<PlanCatalogItem>> GetActivePlansByIdsAsync(
        IReadOnlyCollection<int> ids,
        CancellationToken cancellationToken)
    {
        var plans = await BasePlanQuery()
            .Where(plan => ids.Contains(plan.Id))
            .ToArrayAsync(cancellationToken);
        return plans.Select(MapPlan).ToArray();
    }

    public async Task<IReadOnlyCollection<PlanCatalogItem>> GetActivePlansAsync(CancellationToken cancellationToken)
    {
        var plans = await BasePlanQuery()
            .OrderBy(plan => plan.DisplayOrder)
            .ThenBy(plan => plan.Id)
            .ToArrayAsync(cancellationToken);
        return plans.Select(MapPlan).ToArray();
    }

    public async Task<PromotionCatalogItem?> FindPromotionAsync(string normalizedCode, CancellationToken cancellationToken)
    {
        var promotion = await dbContext.Promotions
            .AsNoTracking()
            .Include(item => item.PromotionServicePlans)
            .SingleOrDefaultAsync(item => item.Code == normalizedCode, cancellationToken);

        return promotion is null
            ? null
            : new PromotionCatalogItem(
                promotion.Id,
                promotion.Code,
                promotion.Name,
                promotion.DiscountType,
                promotion.DiscountValue,
                promotion.StartAt,
                promotion.EndAt,
                promotion.UsageLimit,
                promotion.UsedCount,
                promotion.IsActive,
                promotion.MaxDiscountAmount,
                promotion.MinOrderValue,
                promotion.PromotionServicePlans.Select(item => item.ServicePlanId).ToArray());
    }

    public async Task<bool> TryReservePromotionUseAsync(string normalizedCode, int servicePlanId, DateTime utcNow, CancellationToken cancellationToken)
    {
        var affected = await dbContext.Promotions
            .Where(promotion => promotion.Code == normalizedCode
                && promotion.IsActive
                && promotion.StartAt <= utcNow
                && promotion.EndAt > utcNow
                && (promotion.UsageLimit == null || promotion.UsedCount < promotion.UsageLimit)
                && (!promotion.PromotionServicePlans.Any() || promotion.PromotionServicePlans.Any(item => item.ServicePlanId == servicePlanId)))
            .ExecuteUpdateAsync(updates => updates.SetProperty(promotion => promotion.UsedCount, promotion => promotion.UsedCount + 1), cancellationToken);

        return affected == 1;
    }

    private IQueryable<ServicePlan> BasePlanQuery()
    {
        return dbContext.ServicePlans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(plan => plan.Category)
            .Include(plan => plan.Prices)
            .Where(plan => plan.IsActive && plan.Category.IsActive);
    }

    private static PlanCatalogItem MapPlan(ServicePlan plan)
    {
        return new PlanCatalogItem(
            plan.Id,
            plan.Name,
            plan.Slug,
            plan.Category.Name,
            plan.Category.Slug,
            plan.ShortDescription,
            plan.CpuCores,
            plan.RamGb,
            plan.StorageGb,
            plan.StorageType,
            plan.BandwidthGb,
            plan.SpecificationsJson,
            plan.Prices
                .Where(price => price.IsActive)
                .Select(price => new PlanCatalogPrice(
                    price.Id,
                    price.BillingCycle,
                    price.OriginalPrice,
                    price.SalePrice,
                    price.Currency,
                    price.EffectiveFrom,
                    price.EffectiveTo))
                .ToArray());
    }
}
