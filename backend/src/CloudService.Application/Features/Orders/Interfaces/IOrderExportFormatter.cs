using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Orders.Interfaces;

public interface IOrderExportFormatter
{
    OrderExportResult Create(IReadOnlyCollection<OrderRequest> orders, DateTime exportedAtUtc);
}
