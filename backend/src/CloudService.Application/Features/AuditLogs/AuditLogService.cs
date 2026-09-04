using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.AuditLogs.Interfaces;
using CloudService.Application.Features.AuditLogs.Models;

namespace CloudService.Application.Features.AuditLogs;

public sealed class AuditLogService(IAuditLogReadStore readStore) : IAuditLogService
{
    public Task<PagedResult<AuditLogItem>> GetAsync(
        PagedRequest paging,
        AuditLogFilter filter,
        CancellationToken cancellationToken)
    {
        if (filter.FromUtc is not null && filter.ToUtc is not null && filter.ToUtc < filter.FromUtc)
        {
            throw new RequestValidationException(nameof(filter.ToUtc), "Thời điểm kết thúc phải sau thời điểm bắt đầu.");
        }

        return readStore.GetAsync(paging, filter with { Action = filter.Action?.Trim() }, cancellationToken);
    }
}
