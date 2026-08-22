using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Dashboard.Interfaces;
using CloudService.Application.Features.Dashboard.Models;

namespace CloudService.Application.Features.Dashboard;

public sealed class DashboardService(IDashboardRepository repository) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync(int months, CancellationToken cancellationToken)
    {
        if (months is < 1 or > 24) throw new RequestValidationException(nameof(months), "Số tháng phải nằm trong khoảng 1-24.");
        var summary = await repository.GetSummaryAsync(cancellationToken);
        var byMonth = await repository.GetOrdersByMonthAsync(months, cancellationToken);
        var topPlans = await repository.GetTopServicePlansAsync(10, cancellationToken);
        return new DashboardResponse(summary, byMonth, topPlans);
    }
}
