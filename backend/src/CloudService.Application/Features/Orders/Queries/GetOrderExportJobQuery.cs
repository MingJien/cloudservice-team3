using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed record GetOrderExportJobQuery(Guid JobId, int RequestedByUserId) : IRequest<Result<OrderExportJobResponse>>;
