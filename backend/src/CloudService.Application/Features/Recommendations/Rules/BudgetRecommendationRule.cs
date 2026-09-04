using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;

namespace CloudService.Application.Features.Recommendations.Rules;

public sealed class BudgetRecommendationRule : IRecommendationRule
{
    public RecommendationRuleResult Evaluate(RecommendationContext context)
    {
        var price = context.Price.SalePrice ?? context.Price.OriginalPrice;
        var budget = context.Request.Budget;
        if (budget <= 0)
        {
            return new RecommendationRuleResult(15, "Bạn chưa giới hạn ngân sách; hệ thống ưu tiên độ phù hợp cấu hình.");
        }

        if (price <= budget)
        {
            return new RecommendationRuleResult(30, "Giá gói nằm trong ngân sách đã chọn.");
        }

        if (price <= budget * 1.25m)
        {
            return new RecommendationRuleResult(10, "Giá cao hơn ngân sách không quá 25%, có thể cân nhắc khi cần thêm tài nguyên.");
        }

        return new RecommendationRuleResult(0, "Giá gói vượt đáng kể ngân sách đã chọn.");
    }
}
