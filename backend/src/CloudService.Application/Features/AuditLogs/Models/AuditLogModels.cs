namespace CloudService.Application.Features.AuditLogs.Models;

public sealed record AuditLogFilter(
    string? Action = null,
    int? UserId = null,
    DateTime? FromUtc = null,
    DateTime? ToUtc = null);

public sealed record AuditLogItem(
    long Id,
    int? UserId,
    string? UserName,
    string Action,
    string? EntityName,
    string? EntityId,
    string? OldValues,
    string? NewValues,
    string? IpAddress,
    DateTime CreatedAt);
