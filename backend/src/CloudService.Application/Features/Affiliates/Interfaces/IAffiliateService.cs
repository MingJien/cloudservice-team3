using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Models;

namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateService
{
    Task<AffiliateApplicationSubmissionReceipt> CreateAsync(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken);
    Task<AffiliateApplicationTrackingItem> GetPublicStatusAsync(string trackingCode, CancellationToken cancellationToken);
    Task<PagedResult<AffiliateApplicationItem>> GetAsync(AffiliateListQuery query, CancellationToken cancellationToken);
    Task<AffiliateStatusUpdateResult> UpdateStatusAsync(long id, UpdateAffiliateStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<AffiliateApplicationItem> UpdateAsync(long id, UpdateAffiliateApplicationRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeleteAsync(long id, DeleteAffiliateApplicationRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<ReferralTrackedResponse> TrackReferralAsync(TrackAffiliateReferralRequest request, CancellationToken cancellationToken);
}
