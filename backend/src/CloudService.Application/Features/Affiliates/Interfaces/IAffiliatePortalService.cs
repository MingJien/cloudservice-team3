using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Models;

namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliatePortalService
{
    Task<AffiliatePortalDashboard> GetDashboardAsync(int userId, CancellationToken cancellationToken);
    Task<PagedResult<AffiliatePortalOrderItem>> GetOrdersAsync(int userId, int pageNumber, int pageSize, CancellationToken cancellationToken);
    Task<PagedResult<AffiliatePayoutItem>> GetMyPayoutsAsync(int userId, int pageNumber, int pageSize, CancellationToken cancellationToken);
    Task<AffiliatePayoutItem> RequestPayoutAsync(int userId, CreateAffiliatePayoutRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<AffiliatePayoutItem>> GetPayoutsAsync(AffiliatePayoutListQuery query, CancellationToken cancellationToken);
    Task<AffiliatePayoutItem> ReviewPayoutAsync(long id, ReviewAffiliatePayoutRequest request, int reviewerId, string? ipAddress, CancellationToken cancellationToken);
    Task RunMaintenanceAsync(CancellationToken cancellationToken);
}
