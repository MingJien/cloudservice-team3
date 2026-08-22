using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing.Strategies;

public sealed class FixedAmountDiscountStrategy : IPromotionDiscountStrategy
{
    public DiscountType DiscountType => DiscountType.FixedAmount;

    public decimal Calculate(decimal amount, decimal discountValue)
    {
        return Math.Min(amount, decimal.Round(discountValue, 2, MidpointRounding.AwayFromZero));
    }
}
