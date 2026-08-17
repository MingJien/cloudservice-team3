using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class PlanPrice : AuditableEntity
{
    private PlanPrice()
    {
    }

    public PlanPrice(int servicePlanId, BillingCycle billingCycle, decimal originalPrice, decimal? salePrice = null)
    {
        ServicePlanId = servicePlanId > 0 ? servicePlanId : throw new ArgumentOutOfRangeException(nameof(servicePlanId));
        BillingCycle = billingCycle;
        OriginalPrice = Guard.NonNegative(originalPrice, nameof(originalPrice));
        if (salePrice is < 0 || salePrice > originalPrice)
        {
            throw new ArgumentOutOfRangeException(nameof(salePrice));
        }

        SalePrice = salePrice;
    }

    public int ServicePlanId { get; private set; }
    public BillingCycle BillingCycle { get; private set; }
    public decimal OriginalPrice { get; private set; }
    public decimal? SalePrice { get; private set; }
    public string Currency { get; private set; } = "VND";
    public DateTime? EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }
    public bool IsActive { get; private set; } = true;
    public ServicePlan ServicePlan { get; private set; } = null!;
    public ICollection<OrderRequest> OrderRequests { get; private set; } = new List<OrderRequest>();

    public void Update(
        BillingCycle billingCycle,
        decimal originalPrice,
        decimal? salePrice,
        string currency,
        DateTime? effectiveFrom,
        DateTime? effectiveTo)
    {
        if (salePrice is < 0 || salePrice > originalPrice) throw new ArgumentOutOfRangeException(nameof(salePrice));
        if (effectiveFrom is not null && effectiveTo is not null && effectiveTo <= effectiveFrom)
            throw new ArgumentException("EffectiveTo must be after EffectiveFrom.", nameof(effectiveTo));

        BillingCycle = billingCycle;
        OriginalPrice = Guard.NonNegative(originalPrice, nameof(originalPrice));
        SalePrice = salePrice;
        Currency = string.IsNullOrWhiteSpace(currency) ? "VND" : currency.Trim().ToUpperInvariant();
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
