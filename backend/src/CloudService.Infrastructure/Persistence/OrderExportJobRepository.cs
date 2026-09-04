using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class OrderExportJobRepository(ApplicationDbContext dbContext) : IOrderExportJobRepository
{
    public void Add(OrderExportJob job) => dbContext.OrderExportJobs.Add(job);

    public Task<OrderExportJob?> GetByIdAsync(Guid id, int requestedByUserId, CancellationToken cancellationToken) =>
        dbContext.OrderExportJobs.SingleOrDefaultAsync(
            job => job.Id == id && job.RequestedByUserId == requestedByUserId,
            cancellationToken);

    public Task<OrderExportJob?> GetNextPendingAsync(CancellationToken cancellationToken) =>
        dbContext.OrderExportJobs
            .Where(job => job.Status == OrderExportJobStatus.Pending)
            .OrderBy(job => job.RequestedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<int> RequeueStaleProcessingAsync(DateTime staleBeforeUtc, CancellationToken cancellationToken) =>
        dbContext.OrderExportJobs
            .Where(job => job.Status == OrderExportJobStatus.Processing
                && job.StartedAtUtc != null
                && job.StartedAtUtc < staleBeforeUtc)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(job => job.Status, OrderExportJobStatus.Pending)
                .SetProperty(job => job.StartedAtUtc, (DateTime?)null)
                .SetProperty(job => job.Error, "Worker trước đó đã dừng; tác vụ được đưa lại vào hàng đợi."), cancellationToken);

    public async Task<IReadOnlyCollection<OrderExportJob>> GetExpiredAsync(DateTime utcNow, CancellationToken cancellationToken) =>
        await dbContext.OrderExportJobs
            .Where(job => job.Status == OrderExportJobStatus.Completed && job.ExpiresAtUtc <= utcNow)
            .Take(50)
            .ToArrayAsync(cancellationToken);

    public void SetOriginalRowVersion(OrderExportJob job, byte[] rowVersion) =>
        dbContext.Entry(job).Property(item => item.RowVersion).OriginalValue = rowVersion;
}
