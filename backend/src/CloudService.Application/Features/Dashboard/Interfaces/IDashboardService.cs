using CloudService.Application.Features.Dashboard.Models;

namespace CloudService.Application.Features.Dashboard.Interfaces;

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(int months, CancellationToken cancellationToken);
}
