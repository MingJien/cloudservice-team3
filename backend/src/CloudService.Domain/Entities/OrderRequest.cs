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
    public byte[] RowVersion { get; private set; } = [];
    public ServicePlan ServicePlan { get; private set; } = null!;
    public PlanPrice PlanPrice { get; private set; } = null!;
    public AffiliateReferral? AffiliateReferral { get; private set; }
    public AffiliateAttribution? AffiliateAttribution { get; private set; }

    public void SetPromotion(string? promotionCode, decimal discountAmount)
    {
        if (discountAmount < 0 || discountAmount > UnitPrice) throw new ArgumentOutOfRangeException(nameof(discountAmount));
        PromotionCode = string.IsNullOrWhiteSpace(promotionCode) ? null : promotionCode.Trim().ToUpperInvariant();
        DiscountAmount = discountAmount;
        EstimatedAmount = UnitPrice - discountAmount;
    }

    public void SetCustomerDetails(string? companyName, string? note)
    {
        CompanyName = string.IsNullOrWhiteSpace(companyName) ? null : companyName.Trim();
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }

    public void ChangeStatus(OrderRequestStatus status, string? internalNote)
    {
        if (!Enum.IsDefined(status)) throw new ArgumentOutOfRangeException(nameof(status));
        Status = status;
        InternalNote = string.IsNullOrWhiteSpace(internalNote) ? InternalNote : internalNote.Trim();
    }
}
