using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using MediatR;

namespace CloudService.Application.Features.Orders.Queries;

public sealed record DownloadOrderExportQuery(Guid JobId, int RequestedByUserId) : IRequest<Result<OrderExportDownload>>;
