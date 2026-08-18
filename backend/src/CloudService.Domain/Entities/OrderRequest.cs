using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class OrderRequest : LongAuditableEntity
{
    private OrderRequest()
    {
    }

    public OrderRequest(string trackingCode, string customerName, string email, string phone, int servicePlanId, int planPriceId, string planNameSnapshot, BillingCycle billingCycleSnapshot, decimal unitPrice, decimal discountAmount)
    {
        TrackingCode = Guard.Required(trackingCode, nameof(trackingCode));
        CustomerName = Guard.Required(customerName, nameof(customerName));
        Email = Guard.Required(email, nameof(email));
        Phone = Guard.Required(phone, nameof(phone));
        ServicePlanId = servicePlanId > 0 ? servicePlanId : throw new ArgumentOutOfRangeException(nameof(servicePlanId));
        PlanPriceId = planPriceId > 0 ? planPriceId : throw new ArgumentOutOfRangeException(nameof(planPriceId));
        PlanNameSnapshot = Guard.Required(planNameSnapshot, nameof(planNameSnapshot));
        BillingCycleSnapshot = billingCycleSnapshot;
        UnitPrice = Guard.NonNegative(unitPrice, nameof(unitPrice));
        DiscountAmount = Guard.NonNegative(discountAmount, nameof(discountAmount));
        if (DiscountAmount > UnitPrice)
        {
            throw new ArgumentOutOfRangeException(nameof(discountAmount));
        }

        EstimatedAmount = UnitPrice - DiscountAmount;
    }

    public string TrackingCode { get; private set; } = string.Empty;
    public string CustomerName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? CompanyName { get; private set; }
    public int ServicePlanId { get; private set; }
    public int PlanPriceId { get; private set; }
    public string? PromotionCode { get; private set; }
    public string PlanNameSnapshot { get; private set; } = string.Empty;
    public BillingCycle BillingCycleSnapshot { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal EstimatedAmount { get; private set; }
    public string? Note { get; private set; }
    public string? InternalNote { get; private set; }
    public OrderRequestStatus Status { get; private set; } = OrderRequestStatus.New;
    public ServicePlan ServicePlan { get; private set; } = null!;
    public PlanPrice PlanPrice { get; private set; } = null!;
}
