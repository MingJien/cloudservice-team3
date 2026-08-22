using CloudService.Application.Common.Models;
using CloudService.Application.Features.AuditLogs.Models;

namespace CloudService.Application.Features.AuditLogs.Interfaces;

public interface IAuditLogService
{
    Task<PagedResult<AuditLogItem>> GetAsync(
        PagedRequest paging,
        AuditLogFilter filter,
        CancellationToken cancellationToken);
}
