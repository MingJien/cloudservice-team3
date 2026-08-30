using CloudService.Application.Features.Dashboard.Interfaces;
using CloudService.Application.Features.Dashboard.Models;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class DashboardRepository(ApplicationDbContext dbContext, TimeProvider timeProvider) : IDashboardRepository
{
    public async Task<DashboardSummary> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var totalOrders = await dbContext.OrderRequests.CountAsync(cancellationToken);
        var newOrders = await dbContext.OrderRequests.CountAsync(item => item.Status == OrderRequestStatus.New, cancellationToken);
        var processingOrders = await dbContext.OrderRequests.CountAsync(item => item.Status == OrderRequestStatus.Processing, cancellationToken);
        var doneOrders = await dbContext.OrderRequests.CountAsync(item => item.Status == OrderRequestStatus.Done, cancellationToken);
        var rejectedOrders = await dbContext.OrderRequests.CountAsync(item => item.Status == OrderRequestStatus.Rejected, cancellationToken);
        var affiliates = await dbContext.AffiliateApplications.CountAsync(cancellationToken);
        var newAffiliates = await dbContext.AffiliateApplications.CountAsync(item => item.Status == AffiliateApplicationStatus.New, cancellationToken);
        var newContacts = await dbContext.ContactRequests.CountAsync(item => item.Status == ContactRequestStatus.New, cancellationToken);
        return new DashboardSummary(totalOrders, newOrders, processingOrders, doneOrders, rejectedOrders, affiliates, newAffiliates, newContacts);
    }

    public async Task<IReadOnlyCollection<OrdersByMonthItem>> GetOrdersByMonthAsync(int months, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var start = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));
        var dates = await dbContext.OrderRequests.AsNoTracking().Where(item => item.CreatedAt >= start).Select(item => item.CreatedAt).ToArrayAsync(cancellationToken);
        var counts = dates
            .GroupBy(date => new { date.Year, date.Month })
            .ToDictionary(item => (item.Key.Year, item.Key.Month), item => item.Count());

        // Return a complete time series so the dashboard does not silently hide
        // quiet months or make the chart look artificially short.
        return Enumerable.Range(0, months)
            .Select(offset => start.AddMonths(offset))
            .Select(date => new OrdersByMonthItem(
                $"{date.Year:D4}-{date.Month:D2}",
                counts.GetValueOrDefault((date.Year, date.Month))))
            .ToArray();
    }

    public async Task<IReadOnlyCollection<TopServicePlanItem>> GetTopServicePlansAsync(int take, CancellationToken cancellationToken)
    {
        return await dbContext.OrderRequests.AsNoTracking().GroupBy(item => new { item.ServicePlanId, item.PlanNameSnapshot }).OrderByDescending(group => group.Count()).Take(take).Select(group => new TopServicePlanItem(group.Key.ServicePlanId, group.Key.PlanNameSnapshot, group.Count())).ToArrayAsync(cancellationToken);
    }
}
