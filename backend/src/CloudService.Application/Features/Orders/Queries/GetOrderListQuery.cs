using CloudService.Application.Common.Models;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed record GetOrderListQuery(
    int PageNumber = 1, 
    int PageSize = 20, 
    OrderRequestStatus? Status = null, 
    string? Search = null) : IRequest<Result<PagedResult<OrderAdminItem>>>;
