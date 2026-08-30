using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing.Strategies;

public sealed class PercentageDiscountStrategy : IPromotionDiscountStrategy
{
    public DiscountType DiscountType => DiscountType.Percentage;

    public decimal Calculate(decimal amount, decimal discountValue, decimal? maxDiscountAmount)
    {
        var discount = decimal.Round(amount * discountValue / 100m, 2, MidpointRounding.AwayFromZero);
        if (maxDiscountAmount.HasValue && discount > maxDiscountAmount.Value)
        {
            return maxDiscountAmount.Value;
        }
        return discount;
    }
}
