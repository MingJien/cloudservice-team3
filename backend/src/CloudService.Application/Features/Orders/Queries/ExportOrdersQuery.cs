using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed record ExportOrdersQuery(OrderRequestStatus? Status = null, string? Search = null) : IRequest<Result<OrderExportResult>>;
