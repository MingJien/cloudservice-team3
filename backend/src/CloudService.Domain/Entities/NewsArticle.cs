using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class NewsArticle : AuditableEntity
{
    private NewsArticle()
    {
    }

    public NewsArticle(int categoryId, string title, string slug, string content)
    {
        CategoryId = categoryId > 0 ? categoryId : throw new ArgumentOutOfRangeException(nameof(categoryId));
        Title = Guard.Required(title, nameof(title));
        Slug = Guard.Required(slug, nameof(slug));
        Content = Guard.Required(content, nameof(content));
    }

    public int CategoryId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Summary { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string? ThumbnailUrl { get; private set; }
    public string? AuthorName { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public bool IsPublished { get; private set; }
    public int ViewCount { get; private set; }
    public NewsCategory Category { get; private set; } = null!;
}
