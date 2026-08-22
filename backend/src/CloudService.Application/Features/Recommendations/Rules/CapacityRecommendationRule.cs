using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Rules;

public sealed class CapacityRecommendationRule : IRecommendationRule
{
    public RecommendationRuleResult Evaluate(RecommendationContext context)
    {
        var request = context.Request;
        if (request.MinimumCpuCores == 0 && request.MinimumRamGb == 0 && request.MinimumStorageGb == 0)
        {
            return new RecommendationRuleResult(30, "Không có ngưỡng cấu hình tối thiểu cần loại trừ.");
        }

        var checks = new[]
        {
            request.MinimumCpuCores == 0 || context.Plan.CpuCores >= request.MinimumCpuCores,
            request.MinimumRamGb == 0 || context.Plan.RamGb >= request.MinimumRamGb,
            request.MinimumStorageGb == 0 || context.Plan.StorageGb >= request.MinimumStorageGb
        };
        var matched = checks.Count(value => value);
        return matched == checks.Length
            ? new RecommendationRuleResult(30, "CPU, RAM và dung lượng đáp ứng các ngưỡng tối thiểu đã nhập.")
            : new RecommendationRuleResult(matched * 8, $"Gói đáp ứng {matched}/3 nhóm yêu cầu cấu hình; hãy kiểm tra thông số còn thiếu.");
    }
}
