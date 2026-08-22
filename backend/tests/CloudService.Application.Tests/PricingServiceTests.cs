using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Application.Features.Pricing.Strategies;
using CloudService.Domain.Enums;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class PricingServiceTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 5, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Quote_uses_active_sale_price_without_promotion()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlanAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Plan(1, Price(1, 100m, 80m)));
        var service = CreateService(store);

        var result = await service.QuoteAsync(new PricingQuoteRequest(1, BillingCycle.Monthly, null), CancellationToken.None);

        Assert.Equal(20m, result.PlanDiscountAmount);
        Assert.Equal(0m, result.PromotionDiscountAmount);
        Assert.Equal(80m, result.TotalPrice);
    }

    [Fact]
    public async Task Quote_applies_percentage_strategy_to_effective_plan_price()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlanAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Plan(1, Price(1, 100m, 80m)));
        store.Setup(item => item.FindPromotionAsync("SAVE10", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Promotion(DiscountType.Percentage, 10m));
        var service = CreateService(store);

        var result = await service.QuoteAsync(new PricingQuoteRequest(1, BillingCycle.Monthly, "save10"), CancellationToken.None);

        Assert.Equal(8m, result.PromotionDiscountAmount);
        Assert.Equal(28m, result.TotalDiscountAmount);
        Assert.Equal(72m, result.TotalPrice);
    }

    [Fact]
    public async Task Quote_caps_fixed_discount_at_effective_price()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlanAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Plan(1, Price(1, 100m, 80m)));
        store.Setup(item => item.FindPromotionAsync("FIXED", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Promotion(DiscountType.FixedAmount, 500m));
        var service = CreateService(store);

        var result = await service.QuoteAsync(new PricingQuoteRequest(1, BillingCycle.Monthly, "FIXED"), CancellationToken.None);

        Assert.Equal(80m, result.PromotionDiscountAmount);
        Assert.Equal(0m, result.TotalPrice);
    }

    [Fact]
    public async Task Quote_rejects_promotion_scoped_to_another_plan()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlanAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Plan(1, Price(1, 100m, null)));
        store.Setup(item => item.FindPromotionAsync("OTHER", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Promotion(DiscountType.Percentage, 10m, [99]));
        var service = CreateService(store);

        await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.QuoteAsync(new PricingQuoteRequest(1, BillingCycle.Monthly, "OTHER"), CancellationToken.None));
    }

    [Fact]
    public async Task Quote_fails_when_cycle_has_no_current_price()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlanAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Plan(1, Price(1, 100m, null, BillingCycle.Yearly)));
        var service = CreateService(store);

        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            service.QuoteAsync(new PricingQuoteRequest(1, BillingCycle.Monthly, null), CancellationToken.None));
    }

    private static PricingService CreateService(Mock<IPlanCatalogReadStore> store) => new(
        store.Object,
        [new PercentageDiscountStrategy(), new FixedAmountDiscountStrategy()],
        new FixedTimeProvider(UtcNow));

    internal static PlanCatalogItem Plan(int id, params PlanCatalogPrice[] prices) => new(
        id, $"Plan {id}", $"plan-{id}", "VPS", "vps", "Mô tả", 2, 4m, 80, "NVMe", 2000, null, prices);

    internal static PlanCatalogPrice Price(
        int id,
        decimal original,
        decimal? sale,
        BillingCycle cycle = BillingCycle.Monthly,
        DateTime? effectiveFrom = null) =>
        new(id, cycle, original, sale, "VND", effectiveFrom, null);

    private static PromotionCatalogItem Promotion(
        DiscountType type,
        decimal value,
        IReadOnlyCollection<int>? planIds = null) =>
        new(1, type == DiscountType.Percentage ? "SAVE10" : "FIXED", "Khuyến mãi", type, value,
            UtcNow.AddDays(-1), UtcNow.AddDays(1), null, 0, true, planIds ?? Array.Empty<int>());

    internal sealed class FixedTimeProvider(DateTime utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => new(utcNow);
    }
}
