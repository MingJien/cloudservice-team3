using CloudService.Application.Common.Models;
using CloudService.Application.Features.AuditLogs.Interfaces;
using CloudService.Application.Features.AuditLogs.Models;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class AuditLogReadStore(ApplicationDbContext dbContext) : IAuditLogReadStore
{
    public async Task<PagedResult<AuditLogItem>> GetAsync(
        PagedRequest paging,
        AuditLogFilter filter,
        CancellationToken cancellationToken)
    {
        var query = dbContext.AuditLogs.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            query = query.Where(log => log.Action.Contains(filter.Action));
        }

        if (filter.UserId is not null)
        {
            query = query.Where(log => log.UserId == filter.UserId);
        }

        if (filter.FromUtc is not null)
        {
            query = query.Where(log => log.CreatedAt >= filter.FromUtc);
        }

        if (filter.ToUtc is not null)
        {
            query = query.Where(log => log.CreatedAt <= filter.ToUtc);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(log => log.CreatedAt)
            .ThenByDescending(log => log.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(log => new AuditLogItem(
                log.Id,
                log.UserId,
                log.User == null ? null : log.User.UserName,
                log.Action,
                log.EntityName,
                log.EntityId,
                log.OldValues,
                log.NewValues,
                log.IpAddress,
                log.CreatedAt))
            .ToArrayAsync(cancellationToken);

        return PagedResult<AuditLogItem>.Create(items, paging.PageNumber, paging.PageSize, totalCount);
    }
}
