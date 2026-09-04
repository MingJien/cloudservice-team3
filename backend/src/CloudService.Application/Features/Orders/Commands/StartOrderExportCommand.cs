using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed record StartOrderExportCommand(
    int RequestedByUserId,
    OrderRequestStatus? Status,
    string? Search) : IRequest<Result<OrderExportJobResponse>>;
