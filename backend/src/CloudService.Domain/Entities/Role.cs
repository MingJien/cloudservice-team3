using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class Role : BaseEntity
{
    private Role()
    {
    }

    public Role(string name, string? description = null)
    {
        Name = Guard.Required(name, nameof(name));
        Description = description?.Trim();
    }

    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public ICollection<AppUser> Users { get; private set; } = new List<AppUser>();
}
