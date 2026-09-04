using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Domain.Enums;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class PlanComparisonServiceTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 5, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Compare_rejects_more_than_three_plans()
    {
        var service = new PlanComparisonService(
            Mock.Of<IPlanCatalogReadStore>(),
            new PricingServiceTests.FixedTimeProvider(UtcNow));

        await Assert.ThrowsAsync<RequestValidationException>(() =>
            service.CompareAsync([1, 2, 3, 4], CancellationToken.None));
    }

    [Fact]
    public async Task Compare_preserves_requested_order_and_selects_latest_current_price()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        var first = PricingServiceTests.Plan(1,
            PricingServiceTests.Price(10, 100m, null),
            PricingServiceTests.Price(11, 90m, null, effectiveFrom: UtcNow.AddDays(-1)));
        var second = PricingServiceTests.Plan(2, PricingServiceTests.Price(20, 200m, 180m, BillingCycle.Monthly));
        store.Setup(item => item.GetActivePlansByIdsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second]);
        var service = new PlanComparisonService(store.Object, new PricingServiceTests.FixedTimeProvider(UtcNow));

        var result = await service.CompareAsync([2, 1], CancellationToken.None);

        Assert.Equal([2, 1], result.Plans.Select(plan => plan.Id));
        Assert.Equal(11, result.Plans.Last().Prices.Single().PlanPriceId);
    }
}
