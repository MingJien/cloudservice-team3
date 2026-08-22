using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed class ExportOrdersQueryHandler(
    IOrderRepository repository,
    IOrderExportFormatter exportFormatter,
    TimeProvider timeProvider)
    : IRequestHandler<ExportOrdersQuery, Result<OrderExportResult>>
{
    public async Task<Result<OrderExportResult>> Handle(ExportOrdersQuery request, CancellationToken cancellationToken)
    {
        var rows = await repository.GetForExportAsync(request.Status, request.Search, cancellationToken);
        var result = exportFormatter.Create(rows, timeProvider.GetUtcNow().UtcDateTime);
        
        return Result.Success(result);
    }
}
