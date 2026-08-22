using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class AffiliateRepository(ApplicationDbContext dbContext) : IAffiliateRepository
{
    public async Task<PagedResult<AffiliateApplication>> GetAsync(int pageNumber, int pageSize, AffiliateApplicationStatus? status, string? search, CancellationToken cancellationToken)
    {
        var normalized = search?.Trim().ToUpperInvariant();
        var query = dbContext.AffiliateApplications
            .AsNoTracking()
            .Include(item => item.Partner)!
                .ThenInclude(item => item!.Referrals)
            .Include(item => item.Partner)!
                .ThenInclude(item => item!.Attributions)
            .AsSplitQuery()
            .AsQueryable();
        if (status is not null) query = query.Where(item => item.Status == status);
        if (!string.IsNullOrWhiteSpace(normalized)) query = query.Where(item => item.FullName.ToUpper().Contains(normalized) || item.Email.ToUpper().Contains(normalized));
        var ordered = query.OrderByDescending(item => item.CreatedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<AffiliateApplication>.Create(items, pageNumber, pageSize, total);
    }

    public Task<AffiliateApplication?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.AffiliateApplications
            .Include(item => item.Partner)!
                .ThenInclude(item => item!.Referrals)
            .Include(item => item.Partner)!
                .ThenInclude(item => item!.Attributions)
            .AsSplitQuery()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task<AffiliatePartner?> GetActivePartnerByCodeAsync(string normalizedCode, CancellationToken cancellationToken) =>
        dbContext.AffiliatePartners.SingleOrDefaultAsync(item => item.Code == normalizedCode && item.IsActive, cancellationToken);

    public Task<AffiliateReferral?> GetReferralAsync(Guid visitId, CancellationToken cancellationToken) =>
        dbContext.AffiliateReferrals.SingleOrDefaultAsync(item => item.VisitId == visitId, cancellationToken);

    public Task<bool> PartnerCodeExistsAsync(string normalizedCode, CancellationToken cancellationToken) =>
        dbContext.AffiliatePartners.AnyAsync(item => item.Code == normalizedCode, cancellationToken);

    public Task<AffiliateAttribution?> GetAttributionByOrderIdAsync(long orderId, CancellationToken cancellationToken) =>
        dbContext.AffiliateAttributions.SingleOrDefaultAsync(item => item.OrderRequestId == orderId, cancellationToken);

    public void Add(AffiliateApplication application) => dbContext.AffiliateApplications.Add(application);
    public void Add(AffiliatePartner partner) => dbContext.AffiliatePartners.Add(partner);
    public void Add(AffiliateReferral referral) => dbContext.AffiliateReferrals.Add(referral);
    public void Add(AffiliateAttribution attribution) => dbContext.AffiliateAttributions.Add(attribution);
}
