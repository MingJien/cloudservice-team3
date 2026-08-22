using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing;

public sealed class PricingService(
    IPlanCatalogReadStore catalog,
    IEnumerable<IPromotionDiscountStrategy> discountStrategies,
    TimeProvider timeProvider) : IPricingService
{
    private readonly IReadOnlyDictionary<Domain.Enums.DiscountType, IPromotionDiscountStrategy> _discountStrategies =
        discountStrategies.ToDictionary(strategy => strategy.DiscountType);

    public async Task<PricingQuoteResponse> QuoteAsync(PricingQuoteRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.BillingCycle))
        {
            throw new RequestValidationException(nameof(request.BillingCycle), "Chu kỳ thanh toán không hợp lệ.");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var plan = await catalog.GetActivePlanAsync(request.ServicePlanId, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ đang hoạt động.");
        var price = PlanPriceSelector.SelectCurrent(plan.Prices, request.BillingCycle, utcNow)
            ?? throw new ResourceNotFoundException("Gói chưa có giá hiệu lực cho chu kỳ đã chọn.");

        var effectivePlanPrice = price.SalePrice ?? price.OriginalPrice;
        var planDiscount = price.OriginalPrice - effectivePlanPrice;
        var promotionDiscount = 0m;
        AppliedPromotion? appliedPromotion = null;

        if (!string.IsNullOrWhiteSpace(request.PromotionCode))
        {
            var normalizedCode = request.PromotionCode.Trim().ToUpperInvariant();
            var promotion = await catalog.FindPromotionAsync(normalizedCode, cancellationToken);
            ValidatePromotion(promotion, plan.Id, utcNow);

            var strategy = _discountStrategies[promotion!.DiscountType];
            promotionDiscount = strategy.Calculate(effectivePlanPrice, promotion.DiscountValue);
            appliedPromotion = new AppliedPromotion(
                promotion.Code,
                promotion.Name,
                promotion.DiscountType,
                promotion.DiscountValue);
        }

        var totalDiscount = planDiscount + promotionDiscount;
        var totalPrice = Math.Max(0m, effectivePlanPrice - promotionDiscount);
        return new PricingQuoteResponse(
            plan.Id,
            plan.Name,
            plan.Slug,
            price.Id,
            price.BillingCycle,
            price.OriginalPrice,
            effectivePlanPrice,
            planDiscount,
            promotionDiscount,
            totalDiscount,
            totalPrice,
            price.Currency,
            appliedPromotion,
            utcNow);
    }

    public Task<bool> TryReservePromotionUseAsync(string normalizedCode, int servicePlanId, DateTime utcNow, CancellationToken cancellationToken) =>
        catalog.TryReservePromotionUseAsync(normalizedCode.Trim().ToUpperInvariant(), servicePlanId, utcNow, cancellationToken);

    private static void ValidatePromotion(PromotionCatalogItem? promotion, int servicePlanId, DateTime utcNow)
    {
        var error = promotion switch
        {
            null => "Mã khuyến mãi không tồn tại.",
            { IsActive: false } => "Mã khuyến mãi không hoạt động.",
            _ when promotion.StartAt > utcNow || promotion.EndAt <= utcNow => "Mã khuyến mãi không nằm trong thời gian áp dụng.",
            _ when promotion.UsageLimit is not null && promotion.UsedCount >= promotion.UsageLimit => "Mã khuyến mãi đã hết lượt sử dụng.",
            _ when promotion.ServicePlanIds.Count > 0 && !promotion.ServicePlanIds.Contains(servicePlanId) => "Mã khuyến mãi không áp dụng cho gói đã chọn.",
            _ => null
        };

        if (error is not null)
        {
            throw new RequestValidationException("PromotionCode", error);
        }
    }
}
