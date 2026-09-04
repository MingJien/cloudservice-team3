using CloudService.Domain.Entities;

namespace CloudService.Application.Common.Interfaces;

public interface IUnitOfWork
{
    void AddAuditLog(AuditLog auditLog);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default);
}
