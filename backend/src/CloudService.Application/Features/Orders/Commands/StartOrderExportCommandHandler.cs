using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed class StartOrderExportCommandHandler(
    IOrderExportJobRepository repository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IRequestHandler<StartOrderExportCommand, Result<OrderExportJobResponse>>
{
    public async Task<Result<OrderExportJobResponse>> Handle(StartOrderExportCommand request, CancellationToken cancellationToken)
    {
        if (request.RequestedByUserId <= 0)
            return Result.Failure<OrderExportJobResponse>(new("Auth.InvalidUser", "Không xác định được người yêu cầu."));
        if (request.Search?.Length > 200)
            return Result.Failure<OrderExportJobResponse>(new("Order.ExportSearchTooLong", "Từ khóa xuất tối đa 200 ký tự."));

        var job = new OrderExportJob(
            request.RequestedByUserId,
            request.Status,
            request.Search,
            timeProvider.GetUtcNow().UtcDateTime);
        repository.Add(job);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Map(job));
    }

    internal static OrderExportJobResponse Map(OrderExportJob job) =>
        new(job.Id, job.Status, job.RequestedAtUtc, job.StartedAtUtc, job.CompletedAtUtc,
            job.Status == CloudService.Domain.Enums.OrderExportJobStatus.Completed ? job.ExpiresAtUtc : null,
            job.Status == CloudService.Domain.Enums.OrderExportJobStatus.Completed ? $"/api/order-requests/export/{job.Id:D}/download" : null,
            job.Error);
}
