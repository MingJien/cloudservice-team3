using CloudService.Application.Common.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateRepository
{
    Task<PagedResult<AffiliateApplication>> GetAsync(int pageNumber, int pageSize, AffiliateApplicationStatus? status, string? search, CancellationToken cancellationToken);
    Task<AffiliateApplication?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<AffiliatePartner?> GetActivePartnerByCodeAsync(string normalizedCode, CancellationToken cancellationToken);
    Task<AffiliateReferral?> GetReferralAsync(Guid visitId, CancellationToken cancellationToken);
    Task<bool> PartnerCodeExistsAsync(string normalizedCode, CancellationToken cancellationToken);
    Task<AffiliateAttribution?> GetAttributionByOrderIdAsync(long orderId, CancellationToken cancellationToken);
    void Add(AffiliateApplication application);
    void Add(AffiliatePartner partner);
    void Add(AffiliateReferral referral);
    void Add(AffiliateAttribution attribution);
}
