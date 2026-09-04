using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

/// <summary>
/// Durable export state keeps a slow report out of the HTTP request. The
/// binary is retained briefly in SQL so a restarted worker can resume/status
/// safely without exposing arbitrary filesystem paths.
/// </summary>
public sealed class OrderExportJob
{
    private OrderExportJob()
    {
    }

    public OrderExportJob(int requestedByUserId, OrderRequestStatus? statusFilter, string? search, DateTime requestedAtUtc)
    {
        if (requestedByUserId <= 0) throw new ArgumentOutOfRangeException(nameof(requestedByUserId));
        Id = Guid.NewGuid();
        RequestedByUserId = requestedByUserId;
        StatusFilter = statusFilter;
        Search = string.IsNullOrWhiteSpace(search) ? null : search.Trim()[..Math.Min(search.Trim().Length, 200)];
        RequestedAtUtc = requestedAtUtc;
        // A pending job still has a finite retention horizon so abandoned
        // rows can be purged without a nullable scheduler column.
        ExpiresAtUtc = requestedAtUtc.AddHours(2);
        Status = OrderExportJobStatus.Pending;
    }

    public Guid Id { get; private set; }
    public int RequestedByUserId { get; private set; }
    public OrderRequestStatus? StatusFilter { get; private set; }
    public string? Search { get; private set; }
    public OrderExportJobStatus Status { get; private set; }
    public DateTime RequestedAtUtc { get; private set; }
    public DateTime? StartedAtUtc { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public string? FileName { get; private set; }
    public string? ContentType { get; private set; }
    public byte[]? Content { get; private set; }
    public string? Error { get; private set; }
    public byte[] RowVersion { get; private set; } = [];

    public void MarkProcessing(DateTime utcNow)
    {
        if (Status != OrderExportJobStatus.Pending) return;
        Status = OrderExportJobStatus.Processing;
        StartedAtUtc = utcNow;
        Error = null;
    }

    public void Complete(byte[] content, string fileName, string contentType, DateTime utcNow, TimeSpan retention)
    {
        ArgumentNullException.ThrowIfNull(content);
        if (content.Length == 0) throw new ArgumentException("Tệp xuất không được rỗng.", nameof(content));
        if (string.IsNullOrWhiteSpace(fileName)) throw new ArgumentException("Tên tệp là bắt buộc.", nameof(fileName));
        if (retention <= TimeSpan.Zero) throw new ArgumentOutOfRangeException(nameof(retention));
        Content = content;
        FileName = Path.GetFileName(fileName);
        ContentType = string.IsNullOrWhiteSpace(contentType)
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : contentType;
        CompletedAtUtc = utcNow;
        ExpiresAtUtc = utcNow.Add(retention);
        Status = OrderExportJobStatus.Completed;
        Error = null;
    }

    public void Fail(string error, DateTime utcNow)
    {
        Error = string.IsNullOrWhiteSpace(error) ? "Không thể tạo tệp xuất." : error[..Math.Min(error.Length, 2000)];
        CompletedAtUtc = utcNow;
        Status = OrderExportJobStatus.Failed;
        Content = null;
    }

    public bool IsDownloadable(DateTime utcNow) =>
        Status == OrderExportJobStatus.Completed && Content is { Length: > 0 } && ExpiresAtUtc > utcNow;

    public void Expire()
    {
        if (Status is OrderExportJobStatus.Completed or OrderExportJobStatus.Pending or OrderExportJobStatus.Processing)
        {
            Status = OrderExportJobStatus.Expired;
            Content = null;
            Error ??= "Tác vụ xuất đã quá hạn trước khi được tải xuống hoặc xử lý.";
        }
    }
}
