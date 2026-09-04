namespace CloudService.Infrastructure.Persistence;

public sealed class AuditRetentionOptions
{
    public const string SectionName = "AuditRetention";
    public bool Enabled { get; init; } = true;
    public int RetentionMonths { get; init; } = 6;
    public int LocalRunHour { get; init; } = 2;
}
