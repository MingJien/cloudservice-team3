using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class OutboxMessage
{
    private OutboxMessage()
    {
    }

    public OutboxMessage(string type, string payload, DateTime occurredOnUtc)
    {
        Id = Guid.NewGuid();
        Type = string.IsNullOrWhiteSpace(type) ? throw new ArgumentException("Loại message không được rỗng.", nameof(type)) : type.Trim();
        Payload = string.IsNullOrWhiteSpace(payload) ? throw new ArgumentException("Payload không được rỗng.", nameof(payload)) : payload;
        OccurredOnUtc = occurredOnUtc;
        NextAttemptOnUtc = occurredOnUtc;
    }

    public Guid Id { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public DateTime OccurredOnUtc { get; private set; }
    public OutboxMessageStatus Status { get; private set; } = OutboxMessageStatus.Pending;
    public int AttemptCount { get; private set; }
    public DateTime NextAttemptOnUtc { get; private set; }
    public DateTime? ProcessedOnUtc { get; private set; }
    public DateTime? LockedUntilUtc { get; private set; }
    public Guid? LockId { get; private set; }
    public string? LastError { get; private set; }
    public byte[] RowVersion { get; private set; } = [];

    public bool CanBeClaimed(DateTime utcNow) =>
        Status is OutboxMessageStatus.Pending or OutboxMessageStatus.Processing
        && NextAttemptOnUtc <= utcNow
        && (LockedUntilUtc is null || LockedUntilUtc <= utcNow);

    public void Claim(Guid lockId, DateTime lockedUntilUtc)
    {
        LockId = lockId;
        LockedUntilUtc = lockedUntilUtc;
        Status = OutboxMessageStatus.Processing;
    }

    public void MarkProcessed(DateTime utcNow)
    {
        Status = OutboxMessageStatus.Processed;
        ProcessedOnUtc = utcNow;
        LockedUntilUtc = null;
        LockId = null;
        LastError = null;
    }

    public void MarkFailed(string error, DateTime nextAttemptOnUtc, int maxAttempts)
    {
        AttemptCount++;
        LastError = string.IsNullOrWhiteSpace(error) ? "Unknown notification error." : error[..Math.Min(error.Length, 2000)];
        LockedUntilUtc = null;
        LockId = null;
        NextAttemptOnUtc = nextAttemptOnUtc;
        Status = AttemptCount >= maxAttempts ? OutboxMessageStatus.DeadLetter : OutboxMessageStatus.Pending;
    }
}
