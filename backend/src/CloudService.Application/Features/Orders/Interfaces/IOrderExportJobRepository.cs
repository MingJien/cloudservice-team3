using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Orders.Interfaces;

public interface IOrderExportJobRepository
{
    void Add(OrderExportJob job);
    Task<OrderExportJob?> GetByIdAsync(Guid id, int requestedByUserId, CancellationToken cancellationToken);
    Task<OrderExportJob?> GetNextPendingAsync(CancellationToken cancellationToken);
    Task<int> RequeueStaleProcessingAsync(DateTime staleBeforeUtc, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<OrderExportJob>> GetExpiredAsync(DateTime utcNow, CancellationToken cancellationToken);
    void SetOriginalRowVersion(OrderExportJob job, byte[] rowVersion);
}
