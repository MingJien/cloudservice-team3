using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateRepository
{
    Task<PagedResult<AffiliateApplication>> GetAsync(int pageNumber, int pageSize, AffiliateApplicationStatus? status, string? search, CancellationToken cancellationToken);
    Task<AffiliateApplication?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<AffiliateApplication?> GetByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken);
    Task<bool> TrackingCodeExistsAsync(string trackingCode, CancellationToken cancellationToken);
    Task<AffiliatePartner?> GetActivePartnerByCodeAsync(string normalizedCode, CancellationToken cancellationToken);
    Task<AffiliateReferral?> GetReferralAsync(Guid visitId, CancellationToken cancellationToken);
    Task<bool> PartnerCodeExistsAsync(string normalizedCode, CancellationToken cancellationToken);
    Task<AffiliateDuplicateFields> FindDuplicateApplicationFieldsAsync(string normalizedEmail, string normalizedPhone, string? normalizedWebsite, CancellationToken cancellationToken, long? exceptId = null);
    Task<AffiliateAttribution?> GetAttributionByOrderIdAsync(long orderId, CancellationToken cancellationToken);
    Task<int> GetRoleIdAsync(string roleName, CancellationToken cancellationToken);
    Task<bool> UserNameExistsAsync(string normalizedUserName, CancellationToken cancellationToken);
    Task<bool> UserEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<AffiliatePartner?> GetPartnerByUserIdAsync(int userId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<AffiliatePartner>> GetActivePartnersAsync(CancellationToken cancellationToken);
    Task<PagedResult<AffiliatePayout>> GetPayoutsAsync(int pageNumber, int pageSize, AffiliatePayoutStatus? status, string? search, long? partnerId, CancellationToken cancellationToken);
    Task<AffiliatePayout?> GetPayoutByIdAsync(long id, CancellationToken cancellationToken);
    Task<bool> PayoutCodeExistsAsync(string requestCode, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<AffiliateAttribution>> GetMaturingAttributionsAsync(DateTime utcNow, CancellationToken cancellationToken);
    Task<int> GetCompletedOrdersAsync(long partnerId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken);
    void Add(AffiliateApplication application);
    void Add(AffiliatePartner partner);
    void Add(AffiliateReferral referral);
    void Add(AffiliateAttribution attribution);
    void Add(AppUser user);
    void Add(AffiliatePayout payout);
    void SetOriginalRowVersion(AffiliatePayout payout, byte[] rowVersion);
    void SetOriginalRowVersion(AffiliateApplication application, byte[] rowVersion);
}
