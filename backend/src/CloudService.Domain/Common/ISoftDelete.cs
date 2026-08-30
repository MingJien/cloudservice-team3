namespace CloudService.Domain.Common;

/// <summary>
/// Marks an aggregate that is retained for audit/recovery instead of being physically deleted.
/// Infrastructure applies a global query filter to every implementation.
/// </summary>
public interface ISoftDelete
{
    bool IsDeleted { get; }
}
