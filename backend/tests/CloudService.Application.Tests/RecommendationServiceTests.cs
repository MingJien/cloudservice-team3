using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Recommendations;
using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;
using CloudService.Application.Features.Recommendations.Rules;
using CloudService.Domain.Enums;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class RecommendationServiceTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 5, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public async Task Recommend_ranks_plan_that_meets_budget_capacity_and_purpose_first()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        var suitable = PricingServiceTests.Plan(1, PricingServiceTests.Price(1, 400m, null));
        var weaker = new CloudService.Application.Features.Pricing.Models.PlanCatalogItem(
            2, "Hosting", "hosting", "Hosting", "hosting", null, null, null, 10, "SSD", 200, null,
            [PricingServiceTests.Price(2, 200m, null)]);
        store.Setup(item => item.GetActivePlansAsync(It.IsAny<CancellationToken>())).ReturnsAsync([weaker, suitable]);
        var service = CreateService(store);
        var request = new ServicePlanRecommendationRequest(500m, BillingCycle.Monthly,
            ServicePurpose.BusinessApplication, TrafficLevel.High, 2, 4, 40, 2);

        var result = await service.RecommendAsync(request, CancellationToken.None);

        Assert.Equal(1, result.Items.First().ServicePlanId);
        Assert.True(result.Items.First().Score > result.Items.Last().Score);
    }

    [Fact]
    public async Task Recommend_respects_max_results_and_returns_explainable_reasons()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlansAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                PricingServiceTests.Plan(1, PricingServiceTests.Price(1, 100m, null)),
                PricingServiceTests.Plan(2, PricingServiceTests.Price(2, 200m, null))
            ]);
        var service = CreateService(store);

        var result = await service.RecommendAsync(
            new ServicePlanRecommendationRequest(500m, BillingCycle.Monthly, ServicePurpose.General, TrafficLevel.Low, MaxResults: 1),
            CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(4, item.Reasons.Count);
        Assert.All(item.Reasons, reason => Assert.False(string.IsNullOrWhiteSpace(reason)));
    }

    [Fact]
    public async Task Recommend_fails_when_no_plan_has_price_for_selected_cycle()
    {
        var store = new Mock<IPlanCatalogReadStore>();
        store.Setup(item => item.GetActivePlansAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([PricingServiceTests.Plan(1, PricingServiceTests.Price(1, 100m, null, BillingCycle.Yearly))]);
        var service = CreateService(store);

        await Assert.ThrowsAsync<ResourceNotFoundException>(() => service.RecommendAsync(
            new ServicePlanRecommendationRequest(500m, BillingCycle.Monthly, ServicePurpose.General, TrafficLevel.Low),
            CancellationToken.None));
    }

    private static ServicePlanRecommendationService CreateService(Mock<IPlanCatalogReadStore> store)
    {
        IRecommendationRule[] rules =
        [
            new BudgetRecommendationRule(),
            new CapacityRecommendationRule(),
            new TrafficRecommendationRule(),
            new PurposeRecommendationRule()
        ];
        return new ServicePlanRecommendationService(store.Object, rules, new PricingServiceTests.FixedTimeProvider(UtcNow));
    }
}
