using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Rules;

public sealed class TrafficRecommendationRule : IRecommendationRule
{
    public RecommendationRuleResult Evaluate(RecommendationContext context)
    {
        var requiredBandwidth = context.Request.Traffic switch
        {
            TrafficLevel.Low => 200,
            TrafficLevel.Medium => 1000,
            TrafficLevel.High => 2000,
            _ => 1000
        };
        var bandwidth = context.Plan.BandwidthGb ?? 0;
        if (bandwidth >= requiredBandwidth)
        {
            return new RecommendationRuleResult(20, $"Băng thông {bandwidth:N0} GB phù hợp mức traffic {TrafficLabel(context.Request.Traffic)}.");
        }

        var partialScore = requiredBandwidth == 0 ? 0 : (int)Math.Floor(10m * bandwidth / requiredBandwidth);
        return new RecommendationRuleResult(Math.Clamp(partialScore, 0, 10), $"Băng thông thấp hơn ngưỡng tham chiếu {requiredBandwidth:N0} GB cho mức traffic đã chọn.");
    }

    private static string TrafficLabel(TrafficLevel level) => level switch
    {
        TrafficLevel.Low => "thấp",
        TrafficLevel.Medium => "trung bình",
        TrafficLevel.High => "cao",
        _ => "đã chọn"
    };
}
