using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed class DownloadOrderExportQueryHandler(
    IOrderExportJobRepository repository,
    TimeProvider timeProvider) : IRequestHandler<DownloadOrderExportQuery, Result<OrderExportDownload>>
{
    public async Task<Result<OrderExportDownload>> Handle(DownloadOrderExportQuery request, CancellationToken cancellationToken)
    {
        var job = await repository.GetByIdAsync(request.JobId, request.RequestedByUserId, cancellationToken);
        if (job is null)
            return Result.Failure<OrderExportDownload>(new("Order.ExportNotFound", "Không tìm thấy tác vụ xuất dữ liệu."));
        if (!job.IsDownloadable(timeProvider.GetUtcNow().UtcDateTime))
            return Result.Failure<OrderExportDownload>(new("Order.ExportNotReady", "Tệp xuất chưa sẵn sàng hoặc đã hết hạn."));
        return Result.Success(new OrderExportDownload(
            job.Content!,
            job.FileName!,
            job.ContentType!));
    }
}
