using CloudService.Application.Common.Models;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class OrderRepository(ApplicationDbContext dbContext) : IOrderRepository
{
    public Task<OrderRequest?> GetByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken) =>
        // Orders are immutable commercial snapshots. Archived prices must remain readable for history.
        dbContext.OrderRequests.IgnoreQueryFilters().AsNoTracking().Include(order => order.PlanPrice).Include(order => order.AffiliateAttribution).SingleOrDefaultAsync(order => order.TrackingCode == trackingCode, cancellationToken);

    public Task<OrderRequest?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.OrderRequests.IgnoreQueryFilters().Include(order => order.PlanPrice).Include(order => order.AffiliateAttribution).SingleOrDefaultAsync(order => order.Id == id, cancellationToken);

    public async Task<PagedResult<OrderRequest>> GetAsync(int pageNumber, int pageSize, OrderRequestStatus? status, string? search, CancellationToken cancellationToken)
    {
        var normalized = search?.Trim().ToUpperInvariant();
        var query = dbContext.OrderRequests.IgnoreQueryFilters().AsNoTracking().Include(order => order.PlanPrice).Include(order => order.AffiliateAttribution).AsQueryable();
        if (status is not null) query = query.Where(order => order.Status == status);
        if (!string.IsNullOrWhiteSpace(normalized)) query = query.Where(order => order.TrackingCode.ToUpper().Contains(normalized) || order.CustomerName.ToUpper().Contains(normalized) || order.Email.ToUpper().Contains(normalized));
        var ordered = query.OrderByDescending(order => order.CreatedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<OrderRequest>.Create(items, pageNumber, pageSize, total);
    }

    public Task<bool> TrackingCodeExistsAsync(string trackingCode, CancellationToken cancellationToken) =>
        dbContext.OrderRequests.AnyAsync(order => order.TrackingCode == trackingCode, cancellationToken);

    public void Add(OrderRequest orderRequest) => dbContext.OrderRequests.Add(orderRequest);

    public void SetOriginalRowVersion(OrderRequest orderRequest, byte[] rowVersion) =>
        dbContext.Entry(orderRequest).Property(item => item.RowVersion).OriginalValue = rowVersion;

    public async Task<IReadOnlyCollection<OrderRequest>> GetForExportAsync(OrderRequestStatus? status, string? search, CancellationToken cancellationToken)
    {
        var normalized = search?.Trim().ToUpperInvariant();
        var query = dbContext.OrderRequests.IgnoreQueryFilters().AsNoTracking().Include(order => order.PlanPrice).Include(order => order.AffiliateAttribution).AsQueryable();
        if (status is not null) query = query.Where(order => order.Status == status);
        if (!string.IsNullOrWhiteSpace(normalized)) query = query.Where(order => order.TrackingCode.ToUpper().Contains(normalized) || order.CustomerName.ToUpper().Contains(normalized) || order.Email.ToUpper().Contains(normalized));
        // Fetch one sentinel row so the job can fail explicitly instead of
        // silently delivering a truncated business report.
        return await query.OrderByDescending(order => order.CreatedAt).Take(5001).ToArrayAsync(cancellationToken);
    }
}
