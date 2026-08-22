using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class NewsArticle : AuditableEntity, ISoftDelete
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
    public bool IsDeleted { get; private set; }
    public NewsCategory Category { get; private set; } = null!;

    public void Update(
        int categoryId,
        string title,
        string slug,
        string? summary,
        string content,
        string? thumbnailUrl,
        string? authorName)
    {
        if (categoryId <= 0) throw new ArgumentOutOfRangeException(nameof(categoryId));
        CategoryId = categoryId;
        Title = Guard.Required(title, nameof(title));
        Slug = Guard.Required(slug, nameof(slug));
        Summary = string.IsNullOrWhiteSpace(summary) ? null : summary.Trim();
        Content = Guard.Required(content, nameof(content));
        ThumbnailUrl = string.IsNullOrWhiteSpace(thumbnailUrl) ? null : thumbnailUrl.Trim();
        AuthorName = string.IsNullOrWhiteSpace(authorName) ? null : authorName.Trim();
    }

    public void Publish(DateTime publishedAt)
    {
        IsPublished = true;
        PublishedAt = publishedAt;
    }

    public void Unpublish()
    {
        IsPublished = false;
        PublishedAt = null;
    }

    public void IncrementViewCount() => ViewCount++;

    public void SoftDelete()
    {
        IsDeleted = true;
        Unpublish();
    }

    // Restored articles intentionally return as drafts. Publishing remains an explicit editor action.
    public void Restore() => IsDeleted = false;
}
