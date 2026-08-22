namespace CloudService.Domain.Common;

public abstract class LongAuditableEntity
{
    public long Id { get; protected set; }
    public DateTime CreatedAt { get; protected set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    protected void MarkUpdated(DateTime utcNow)
    {
        UpdatedAt = utcNow;
    }
}
