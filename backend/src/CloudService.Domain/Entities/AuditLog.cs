namespace CloudService.Domain.Entities;

public sealed class AuditLog
{
    private AuditLog()
    {
    }

    public AuditLog(string action, int? userId = null, string? entityName = null, string? entityId = null, string? oldValues = null, string? newValues = null, string? ipAddress = null)
    {
        Action = string.IsNullOrWhiteSpace(action) ? throw new ArgumentException("Action is required.", nameof(action)) : action.Trim();
        UserId = userId;
        EntityName = entityName;
        EntityId = entityId;
        OldValues = oldValues;
        NewValues = newValues;
        IpAddress = ipAddress;
    }

    public long Id { get; private set; }
    public int? UserId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string? EntityName { get; private set; }
    public string? EntityId { get; private set; }
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public AppUser? User { get; private set; }
}
