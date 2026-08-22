namespace CloudService.Domain.Entities;

public sealed class PromotionServicePlan
{
    private PromotionServicePlan()
    {
    }

    public PromotionServicePlan(int promotionId, int servicePlanId)
    {
        PromotionId = promotionId > 0 ? promotionId : throw new ArgumentOutOfRangeException(nameof(promotionId));
        ServicePlanId = servicePlanId > 0 ? servicePlanId : throw new ArgumentOutOfRangeException(nameof(servicePlanId));
    }

    public int PromotionId { get; private set; }
    public int ServicePlanId { get; private set; }
    public Promotion Promotion { get; private set; } = null!;
    public ServicePlan ServicePlan { get; private set; } = null!;
}
