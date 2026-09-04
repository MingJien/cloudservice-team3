using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing;

public static class PlanPriceSelector
{
    public static PlanCatalogPrice? SelectCurrent(
        IEnumerable<PlanCatalogPrice> prices,
        BillingCycle billingCycle,
        DateTime utcNow)
    {
        return prices
            .Where(price =>
                price.BillingCycle == billingCycle &&
                (price.EffectiveFrom is null || price.EffectiveFrom <= utcNow) &&
                (price.EffectiveTo is null || price.EffectiveTo > utcNow))
            .OrderByDescending(price => price.EffectiveFrom.HasValue)
            .ThenByDescending(price => price.EffectiveFrom)
            .ThenByDescending(price => price.Id)
            .FirstOrDefault();
    }
}
