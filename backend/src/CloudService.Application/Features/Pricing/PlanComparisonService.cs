using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing;

public sealed class PlanComparisonService(
    IPlanCatalogReadStore catalog,
    TimeProvider timeProvider) : IPlanComparisonService
{
    public async Task<PlanComparisonResponse> CompareAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken)
    {
        var distinctIds = ids.Where(id => id > 0).Distinct().ToArray();
        if (distinctIds.Length != ids.Count || distinctIds.Length is < 1 or > 3)
        {
            throw new RequestValidationException("ids", "Cần từ 1 đến 3 mã gói hợp lệ và không trùng nhau.");
        }

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var plans = await catalog.GetActivePlansByIdsAsync(distinctIds, cancellationToken);
        if (plans.Count != distinctIds.Length)
        {
            throw new ResourceNotFoundException("Một hoặc nhiều gói so sánh không tồn tại hoặc đã ngừng hoạt động.");
        }

        var order = distinctIds.Select((id, index) => (id, index)).ToDictionary(item => item.id, item => item.index);
        var result = plans
            .OrderBy(plan => order[plan.Id])
            .Select(plan => ToComparedPlan(plan, utcNow))
            .ToArray();
        return new PlanComparisonResponse(result, utcNow);
    }

    private static ComparedPlan ToComparedPlan(PlanCatalogItem plan, DateTime utcNow)
    {
        var currentPrices = plan.Prices
            .Select(price => PlanPriceSelector.SelectCurrent(plan.Prices, price.BillingCycle, utcNow))
            .Where(price => price is not null)
            .DistinctBy(price => price!.BillingCycle)
            .Select(price => new ComparedPlanPrice(
                price!.Id,
                price.BillingCycle,
                price.OriginalPrice,
                price.SalePrice,
                price.SalePrice ?? price.OriginalPrice,
                price.Currency))
            .OrderBy(price => price.BillingCycle)
            .ToArray();

        return new ComparedPlan(
            plan.Id,
            plan.Name,
            plan.Slug,
            plan.CategoryName,
            plan.ShortDescription,
            plan.CpuCores,
            plan.RamGb,
            plan.StorageGb,
            plan.StorageType,
            plan.BandwidthGb,
            ParseSpecifications(plan.SpecificationsJson),
            currentPrices);
    }

    private static IReadOnlyDictionary<string, string> ParseSpecifications(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new Dictionary<string, string>();
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new Dictionary<string, string>();
            }

            return document.RootElement.EnumerateObject()
                .ToDictionary(property => property.Name, property => property.Value.ToString());
        }
        catch (JsonException)
        {
            return new Dictionary<string, string>();
        }
    }
}
