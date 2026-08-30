using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
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
            .Where(item => !item.IsDeleted);
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
            .SingleOrDefaultAsync(item => item.Id == id && !item.IsDeleted, cancellationToken);

    public Task<AffiliateApplication?> GetByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken) =>
        dbContext.AffiliateApplications
            .AsNoTracking()
            .Include(item => item.Partner)
            .SingleOrDefaultAsync(item => item.TrackingCode == trackingCode && !item.IsDeleted, cancellationToken);

    public Task<bool> TrackingCodeExistsAsync(string trackingCode, CancellationToken cancellationToken) =>
        dbContext.AffiliateApplications.AnyAsync(item => item.TrackingCode == trackingCode, cancellationToken);

    public Task<AffiliatePartner?> GetActivePartnerByCodeAsync(string normalizedCode, CancellationToken cancellationToken) =>
        dbContext.AffiliatePartners.SingleOrDefaultAsync(item => item.Code == normalizedCode && item.IsActive, cancellationToken);

    public Task<AffiliateReferral?> GetReferralAsync(Guid visitId, CancellationToken cancellationToken) =>
        dbContext.AffiliateReferrals.SingleOrDefaultAsync(item => item.VisitId == visitId, cancellationToken);

    public Task<bool> PartnerCodeExistsAsync(string normalizedCode, CancellationToken cancellationToken) =>
        dbContext.AffiliatePartners.AnyAsync(item => item.Code == normalizedCode, cancellationToken);

    public async Task<AffiliateDuplicateFields> FindDuplicateApplicationFieldsAsync(string normalizedEmail, string normalizedPhone, string? normalizedWebsite, CancellationToken cancellationToken, long? exceptId = null)
    {
        var active = dbContext.AffiliateApplications.Where(item => !item.IsDeleted && (!exceptId.HasValue || item.Id != exceptId.Value));
        var emailExists = await active.AnyAsync(item => item.Email == normalizedEmail, cancellationToken);
        var phoneExists = await active.AnyAsync(item => item.Phone == normalizedPhone, cancellationToken);
        var websiteExists = normalizedWebsite is not null
            && await active.AnyAsync(item => item.WebsiteOrChannel == normalizedWebsite, cancellationToken);
        return new AffiliateDuplicateFields(emailExists, phoneExists, websiteExists);
    }

    public Task<AffiliateAttribution?> GetAttributionByOrderIdAsync(long orderId, CancellationToken cancellationToken) =>
        dbContext.AffiliateAttributions.SingleOrDefaultAsync(item => item.OrderRequestId == orderId, cancellationToken);

    public Task<int> GetRoleIdAsync(string roleName, CancellationToken cancellationToken) =>
        dbContext.Roles.Where(item => item.Name == roleName).Select(item => item.Id).SingleAsync(cancellationToken);

    public Task<bool> UserNameExistsAsync(string normalizedUserName, CancellationToken cancellationToken) =>
        dbContext.AppUsers.AnyAsync(item => item.UserName.ToUpper() == normalizedUserName, cancellationToken);

    public Task<bool> UserEmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.AppUsers.AnyAsync(item => item.Email.ToUpper() == normalizedEmail, cancellationToken);

    public Task<AffiliatePartner?> GetPartnerByUserIdAsync(int userId, CancellationToken cancellationToken) =>
        dbContext.AffiliatePartners
            .Include(item => item.Application)
            .Include(item => item.Referrals)
            .Include(item => item.Attributions).ThenInclude(item => item.OrderRequest)
            .Include(item => item.Payouts).ThenInclude(item => item.Attributions)
            .AsSplitQuery()
            .SingleOrDefaultAsync(item => item.AppUserId == userId && item.IsActive, cancellationToken);

    public async Task<IReadOnlyCollection<AffiliatePartner>> GetActivePartnersAsync(CancellationToken cancellationToken) =>
        await dbContext.AffiliatePartners.Where(item => item.IsActive).ToArrayAsync(cancellationToken);

    public async Task<PagedResult<AffiliatePayout>> GetPayoutsAsync(int pageNumber, int pageSize, AffiliatePayoutStatus? status, string? search, long? partnerId, CancellationToken cancellationToken)
    {
        var normalized = search?.Trim().ToUpperInvariant();
        var query = dbContext.AffiliatePayouts.AsNoTracking().Include(item => item.AffiliatePartner).AsQueryable();
        if (status is not null) query = query.Where(item => item.Status == status);
        if (partnerId is not null) query = query.Where(item => item.AffiliatePartnerId == partnerId);
        if (!string.IsNullOrWhiteSpace(normalized)) query = query.Where(item => item.RequestCode.ToUpper().Contains(normalized) || item.AffiliatePartner.Code.ToUpper().Contains(normalized) || item.AffiliatePartner.DisplayName.ToUpper().Contains(normalized));
        var ordered = query.OrderByDescending(item => item.RequestedAtUtc);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<AffiliatePayout>.Create(items, pageNumber, pageSize, total);
    }

    public Task<AffiliatePayout?> GetPayoutByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.AffiliatePayouts.Include(item => item.AffiliatePartner).Include(item => item.Attributions).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

    public Task<bool> PayoutCodeExistsAsync(string requestCode, CancellationToken cancellationToken) =>
        dbContext.AffiliatePayouts.AnyAsync(item => item.RequestCode == requestCode, cancellationToken);

    public async Task<IReadOnlyCollection<AffiliateAttribution>> GetMaturingAttributionsAsync(DateTime utcNow, CancellationToken cancellationToken) =>
        await dbContext.AffiliateAttributions.Where(item => item.Status == AffiliateCommissionStatus.Pending && item.EligibleAtUtc != null && item.EligibleAtUtc <= utcNow).ToArrayAsync(cancellationToken);

    public Task<int> GetCompletedOrdersAsync(long partnerId, DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken) =>
        dbContext.AffiliateAttributions.CountAsync(item => item.AffiliatePartnerId == partnerId && item.OrderRequest.Status == OrderRequestStatus.Done && item.CreatedAt >= fromUtc && item.CreatedAt < toUtc, cancellationToken);

    public void Add(AffiliateApplication application) => dbContext.AffiliateApplications.Add(application);
    public void Add(AffiliatePartner partner) => dbContext.AffiliatePartners.Add(partner);
    public void Add(AffiliateReferral referral) => dbContext.AffiliateReferrals.Add(referral);
    public void Add(AffiliateAttribution attribution) => dbContext.AffiliateAttributions.Add(attribution);
    public void Add(AppUser user) => dbContext.AppUsers.Add(user);
    public void Add(AffiliatePayout payout) => dbContext.AffiliatePayouts.Add(payout);
    public void SetOriginalRowVersion(AffiliateApplication application, byte[] rowVersion) =>
        dbContext.Entry(application).Property(item => item.RowVersion).OriginalValue = rowVersion;
    public void SetOriginalRowVersion(AffiliatePayout payout, byte[] rowVersion) =>
        dbContext.Entry(payout).Property(item => item.RowVersion).OriginalValue = rowVersion;
}
