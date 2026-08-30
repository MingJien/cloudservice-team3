using CloudService.Application.Common.Models;
using CloudService.Application.Features.Orders.Commands;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed class GetOrderExportJobQueryHandler(
    IOrderExportJobRepository repository) : IRequestHandler<GetOrderExportJobQuery, Result<OrderExportJobResponse>>
{
    public async Task<Result<OrderExportJobResponse>> Handle(GetOrderExportJobQuery request, CancellationToken cancellationToken)
    {
        var job = await repository.GetByIdAsync(request.JobId, request.RequestedByUserId, cancellationToken);
        return job is null
            ? Result.Failure<OrderExportJobResponse>(new("Order.ExportNotFound", "Không tìm thấy tác vụ xuất dữ liệu."))
            : Result.Success(StartOrderExportCommandHandler.Map(job));
    }
}
