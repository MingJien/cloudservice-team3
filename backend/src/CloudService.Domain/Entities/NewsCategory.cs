using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class NewsCategory : BaseEntity
{
    private NewsCategory()
    {
    }

    public NewsCategory(string name, string slug)
    {
        Name = Guard.Required(name, nameof(name));
        Slug = Guard.Required(slug, nameof(slug));
    }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public ICollection<NewsArticle> Articles { get; private set; } = new List<NewsArticle>();
}
