using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Content.Models;

public sealed class NewsCategoryRequest
{
    [Required, StringLength(100)] public string Name { get; init; } = string.Empty;
    [Required, RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$"), StringLength(150)] public string Slug { get; init; } = string.Empty;
    [StringLength(500)] public string? Description { get; init; }
}

public sealed class NewsArticleRequest
{
    [Range(1, int.MaxValue)] public int CategoryId { get; init; }
    [Required, StringLength(250)] public string Title { get; init; } = string.Empty;
    [Required, RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$"), StringLength(280)] public string Slug { get; init; } = string.Empty;
    [StringLength(1000)] public string? Summary { get; init; }
    [Required] public string Content { get; init; } = string.Empty;
    [Url, StringLength(500)] public string? ThumbnailUrl { get; init; }
    [StringLength(150)] public string? AuthorName { get; init; }
    public bool IsPublished { get; init; }
}

public sealed record NewsCategoryItem(int Id, string Name, string Slug, string? Description, bool IsActive, int PublishedArticleCount, int TotalArticleCount);
public sealed record NewsArticleItem(int Id, int CategoryId, string CategoryName, string CategorySlug, string Title, string Slug, string? Summary, string Content, string? ThumbnailUrl, string? AuthorName, DateTime? PublishedAt, bool IsPublished, bool IsDeleted, int ViewCount, DateTime CreatedAt, DateTime? UpdatedAt);
public sealed record NewsListQuery(int PageNumber = 1, int PageSize = 10, string? Search = null, string? CategorySlug = null, bool IncludeUnpublished = false);
public sealed record TestimonialItem(int Id, string CustomerName, string? CompanyName, string? Position, string Content, string? AvatarUrl, string? LogoUrl, byte Rating, int DisplayOrder, bool IsActive);

public sealed class TestimonialRequest
{
    [Required, StringLength(150)] public string CustomerName { get; init; } = string.Empty;
    [StringLength(200)] public string? CompanyName { get; init; }
    [StringLength(100)] public string? Position { get; init; }
    [Required, StringLength(1000)] public string Content { get; init; } = string.Empty;
    [Url, StringLength(500)] public string? AvatarUrl { get; init; }
    [Url, StringLength(500)] public string? LogoUrl { get; init; }
    [Range(1, 5)] public byte Rating { get; init; } = 5;
    [Range(0, int.MaxValue)] public int DisplayOrder { get; init; }
}

public sealed class CreateContactRequest
{
    [Required, StringLength(150)] public string FullName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(255)] public string Email { get; init; } = string.Empty;
    [Phone, StringLength(20)] public string? Phone { get; init; }
    [Required, StringLength(250)] public string Subject { get; init; } = string.Empty;
    [Required, StringLength(3000)] public string Message { get; init; } = string.Empty;
}

public sealed record ContactRequestItem(long Id, string TrackingCode, string FullName, string Email, string? Phone, string Subject, string Message, string? AdminReply, ContactRequestStatus Status, DateTime CreatedAt, DateTime? UpdatedAt, DateTime? RepliedAt);
public sealed record PublicContactStatusItem(string TrackingCode, string Subject, ContactRequestStatus Status, string? AdminReply, DateTime CreatedAt, DateTime? RepliedAt);
public sealed record ContactListQuery(int PageNumber = 1, int PageSize = 20, ContactRequestStatus? Status = null, string? Search = null);
public sealed class UpdateContactStatusRequest
{
    [Required] public ContactRequestStatus Status { get; init; }
}

public sealed class ReplyContactRequest
{
    [Required, StringLength(3000, MinimumLength = 2)] public string Reply { get; init; } = string.Empty;
}

public sealed record ContentStatusRequest(bool IsActive);
