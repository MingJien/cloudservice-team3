using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations;

public sealed class ServicePlanRecommendationService(
    IPlanCatalogReadStore catalog,
    IEnumerable<IRecommendationRule> rules,
    TimeProvider timeProvider) : IServicePlanRecommendationService
{
    private readonly IReadOnlyCollection<IRecommendationRule> _rules = rules.ToArray();

    public async Task<ServicePlanRecommendationResponse> RecommendAsync(
        ServicePlanRecommendationRequest request,
        CancellationToken cancellationToken)
    {
        Validate(request);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var plans = await catalog.GetActivePlansAsync(cancellationToken);

        var candidates = plans
            .Select(plan => new
            {
                Plan = plan,
                Price = PlanPriceSelector.SelectCurrent(plan.Prices, request.BillingCycle, utcNow)
            })
            .Where(candidate => candidate.Price is not null)
            .Select(candidate =>
            {
                var context = new RecommendationContext(request, candidate.Plan, candidate.Price!);
                var evaluations = _rules.Select(rule => rule.Evaluate(context)).ToArray();
                var effectivePrice = candidate.Price!.SalePrice ?? candidate.Price.OriginalPrice;
                return new RecommendedPlan(
                    candidate.Plan.Id,
                    candidate.Plan.Name,
                    candidate.Plan.Slug,
                    candidate.Plan.CategoryName,
                    evaluations.Sum(item => item.Score),
                    candidate.Price.BillingCycle,
                    effectivePrice,
                    candidate.Price.Currency,
                    evaluations.Select(item => item.Reason).ToArray());
            })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Price)
            .ThenBy(item => item.ServicePlanId)
            .Take(request.MaxResults)
            .ToArray();

        if (candidates.Length == 0)
        {
            throw new ResourceNotFoundException("Chưa có gói đang hoạt động với giá phù hợp chu kỳ đã chọn.");
        }

        return new ServicePlanRecommendationResponse(candidates, utcNow);
    }

    private static void Validate(ServicePlanRecommendationRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.Budget < 0)
        {
            errors[nameof(request.Budget)] = ["Ngân sách không được âm."];
        }

        if (!Enum.IsDefined(request.BillingCycle))
        {
            errors[nameof(request.BillingCycle)] = ["Chu kỳ thanh toán không hợp lệ."];
        }

        if (!Enum.IsDefined(request.Purpose))
        {
            errors[nameof(request.Purpose)] = ["Mục đích sử dụng không hợp lệ."];
        }

        if (!Enum.IsDefined(request.Traffic))
        {
            errors[nameof(request.Traffic)] = ["Mức traffic không hợp lệ."];
        }

        if (request.MaxResults is < 1 or > 3)
        {
            errors[nameof(request.MaxResults)] = ["Số gợi ý phải từ 1 đến 3."];
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }
    }
}
