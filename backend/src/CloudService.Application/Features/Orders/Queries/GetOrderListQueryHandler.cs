using CloudService.Application.Common.Models;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed class GetOrderListQueryHandler(IOrderRepository repository) : IRequestHandler<GetOrderListQuery, Result<PagedResult<OrderAdminItem>>>
{
    public async Task<Result<PagedResult<OrderAdminItem>>> Handle(GetOrderListQuery request, CancellationToken cancellationToken)
    {
        if (request.PageNumber < 1 || request.PageSize is < 1 or > 100) 
            return Result.Failure<PagedResult<OrderAdminItem>>(new Error("Order.InvalidPaging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100."));
            
        var result = await repository.GetAsync(request.PageNumber, request.PageSize, request.Status, request.Search, cancellationToken);
        var pagedResult = PagedResult<OrderAdminItem>.Create(result.Items.Select(Map), request.PageNumber, request.PageSize, result.TotalCount);
        
        return Result.Success(pagedResult);
    }

    private static OrderAdminItem Map(OrderRequest order) => new(
        order.Id, 
        order.TrackingCode, 
        order.CustomerName, 
        order.Email, 
        order.Phone, 
        order.CompanyName, 
        order.ServicePlanId, 
        order.PlanNameSnapshot, 
        order.BillingCycleSnapshot, 
        order.PromotionCode, 
        order.UnitPrice, 
        order.DiscountAmount, 
        order.EstimatedAmount, 
        order.PlanPrice.Currency, 
        order.Note, 
        order.InternalNote, 
        order.AffiliateAttribution?.AffiliateCodeSnapshot,
        order.AffiliateAttribution?.CommissionAmount,
        order.Status, 
        order.CreatedAt, 
        order.UpdatedAt,
        Convert.ToBase64String(order.RowVersion));
}
