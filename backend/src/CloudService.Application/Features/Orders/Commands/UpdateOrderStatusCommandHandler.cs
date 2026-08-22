using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Orders.Events;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed class UpdateOrderStatusCommandHandler(
    IOrderRepository repository,
    IOutboxWriter outboxWriter,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider)
    : IRequestHandler<UpdateOrderStatusCommand, Result>
{
    public async Task<Result> Handle(UpdateOrderStatusCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status))
            return Result.Failure(new Error("Order.InvalidStatus", "Trạng thái không hợp lệ."));
        if (request.Status == OrderRequestStatus.Rejected && string.IsNullOrWhiteSpace(request.InternalNote))
            return Result.Failure(new Error("Order.MissingNote", "Phải ghi rõ lý do khi từ chối yêu cầu."));

        byte[] rowVersion;
        try
        {
            rowVersion = Convert.FromBase64String(request.RowVersion);
            if (rowVersion.Length != 8) throw new FormatException();
        }
        catch (FormatException)
        {
            return Result.Failure(new Error("Order.InvalidRowVersion", "Mã phiên bản dữ liệu không hợp lệ."));
        }

        var order = await repository.GetByIdAsync(request.Id, cancellationToken);
        if (order is null)
            return Result.Failure(new Error("Order.NotFound", "Không tìm thấy yêu cầu đặt dịch vụ."));
        if (!IsAllowedTransition(order.Status, request.Status))
            return Result.Failure(new Error("Order.InvalidTransition", "Không thể chuyển trạng thái theo quy trình nghiệp vụ."));

        repository.SetOriginalRowVersion(order, rowVersion);
        var oldStatus = order.Status;
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        order.ChangeStatus(request.Status, request.InternalNote);
        if (order.AffiliateAttribution is not null)
        {
            if (request.Status == OrderRequestStatus.Done) order.AffiliateAttribution.MarkEligible(utcNow);
            if (request.Status == OrderRequestStatus.Rejected) order.AffiliateAttribution.Reject(utcNow);
        }

        unitOfWork.AddAuditLog(new AuditLog("Order.StatusChanged", request.UserId, nameof(OrderRequest), order.Id.ToString(), oldValues: $"{{\"status\":\"{oldStatus}\"}}", newValues: $"{{\"status\":\"{request.Status}\"}}", ipAddress: request.IpAddress));
        if (oldStatus != request.Status)
            outboxWriter.Enqueue("OrderStatusChangedV1", new OrderStatusChangedV1(Guid.NewGuid(), order.TrackingCode, oldStatus, request.Status, utcNow), utcNow);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }

    private static bool IsAllowedTransition(OrderRequestStatus current, OrderRequestStatus next) =>
        current == next || (current, next) switch
        {
            (OrderRequestStatus.New, OrderRequestStatus.Processing or OrderRequestStatus.Rejected) => true,
            (OrderRequestStatus.Processing, OrderRequestStatus.Done or OrderRequestStatus.Rejected) => true,
            _ => false
        };
}
