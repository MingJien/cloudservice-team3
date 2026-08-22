using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Models;

namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateService
{
    Task<AffiliateApplicationItem> CreateAsync(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken);
    Task<PagedResult<AffiliateApplicationItem>> GetAsync(AffiliateListQuery query, CancellationToken cancellationToken);
    Task<AffiliateApplicationItem> UpdateStatusAsync(long id, UpdateAffiliateStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<ReferralTrackedResponse> TrackReferralAsync(TrackAffiliateReferralRequest request, CancellationToken cancellationToken);
}
