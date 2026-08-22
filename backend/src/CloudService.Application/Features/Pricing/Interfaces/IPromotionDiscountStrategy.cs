using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Pricing.Interfaces;

public interface IPromotionDiscountStrategy
{
    DiscountType DiscountType { get; }
    decimal Calculate(decimal amount, decimal discountValue);
}
