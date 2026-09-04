using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed class TrackOrderQueryHandler(IOrderRepository repository) : IRequestHandler<TrackOrderQuery, Result<OrderTrackingResponse>>
{
    public async Task<Result<OrderTrackingResponse>> Handle(TrackOrderQuery request, CancellationToken cancellationToken)
    {
        var normalized = request.TrackingCode.Trim().ToUpperInvariant();
        var order = await repository.GetByTrackingCodeAsync(normalized, cancellationToken);
        
        if (order is null) 
            return Result.Failure<OrderTrackingResponse>(new Error("Order.NotFound", "Không tìm thấy yêu cầu với mã tra cứu này."));
            
        var response = new OrderTrackingResponse(
            order.TrackingCode, 
            order.PlanNameSnapshot, 
            order.BillingCycleSnapshot, 
            order.EstimatedAmount, 
            order.PlanPrice.Currency, 
            order.Status, 
            order.CreatedAt, 
            order.UpdatedAt);
            
        return Result.Success(response);
    }
}
