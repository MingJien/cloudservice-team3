using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class ServiceCategory : AuditableEntity
{
    private ServiceCategory()
    {
    }

    public ServiceCategory(string name, string slug, int displayOrder = 0)
    {
        Name = Guard.Required(name, nameof(name));
        Slug = Guard.Required(slug, nameof(slug));
        DisplayOrder = displayOrder >= 0 ? displayOrder : throw new ArgumentOutOfRangeException(nameof(displayOrder));
    }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Icon { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;
    public ICollection<ServicePlan> ServicePlans { get; private set; } = new List<ServicePlan>();
}
