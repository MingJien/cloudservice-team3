using CloudService.Application.Features.Dashboard.Models;

namespace CloudService.Application.Features.Dashboard.Interfaces;

public interface IDashboardRepository
{
    Task<DashboardSummary> GetSummaryAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<OrdersByMonthItem>> GetOrdersByMonthAsync(int months, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<TopServicePlanItem>> GetTopServicePlansAsync(int take, CancellationToken cancellationToken);
}
