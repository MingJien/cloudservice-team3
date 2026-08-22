using CloudService.Application.Common.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Orders.Interfaces;

public interface IOrderRepository
{
    Task<OrderRequest?> GetByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken);
    Task<OrderRequest?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<PagedResult<OrderRequest>> GetAsync(int pageNumber, int pageSize, OrderRequestStatus? status, string? search, CancellationToken cancellationToken);
    Task<bool> TrackingCodeExistsAsync(string trackingCode, CancellationToken cancellationToken);
    void Add(OrderRequest orderRequest);
    void SetOriginalRowVersion(OrderRequest orderRequest, byte[] rowVersion);
    Task<IReadOnlyCollection<OrderRequest>> GetForExportAsync(OrderRequestStatus? status, string? search, CancellationToken cancellationToken);
}
