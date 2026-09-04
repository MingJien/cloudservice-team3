using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Orders.Models;

public sealed record OrderExportJobResponse(
    Guid JobId,
    OrderExportJobStatus Status,
    DateTime RequestedAtUtc,
    DateTime? StartedAtUtc,
    DateTime? CompletedAtUtc,
    DateTime? ExpiresAtUtc,
    string? DownloadUrl,
    string? Error);

public sealed record OrderExportDownload(byte[] Content, string FileName, string ContentType);
