using CloudService.Application.Common.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Content.Interfaces;

public interface IContentRepository
{
    Task<PagedResult<NewsCategory>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken);
    Task<NewsCategory?> GetCategoryAsync(int id, CancellationToken cancellationToken);
    Task<bool> CategorySlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken);
    Task<PagedResult<NewsArticle>> GetArticlesAsync(int pageNumber, int pageSize, string? search, string? categorySlug, bool includeUnpublished, CancellationToken cancellationToken);
    Task<NewsArticle?> GetArticleBySlugAsync(string slug, bool includeUnpublished, CancellationToken cancellationToken);
    Task<NewsArticle?> GetArticleAsync(int id, CancellationToken cancellationToken);
    Task<bool> ArticleSlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken);
    Task<PagedResult<Testimonial>> GetTestimonialsAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken);
    Task<Testimonial?> GetTestimonialAsync(int id, CancellationToken cancellationToken);
    Task<PagedResult<ContactRequest>> GetContactsAsync(int pageNumber, int pageSize, ContactRequestStatus? status, string? search, CancellationToken cancellationToken);
    Task<ContactRequest?> GetContactAsync(long id, CancellationToken cancellationToken);
    Task<ContactRequest?> GetContactByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken);
    void Add(NewsCategory category);
    void Add(NewsArticle article);
    void Add(Testimonial testimonial);
    void Add(ContactRequest request);
    void Remove(NewsCategory category);
    void Remove(NewsArticle article);
    void Remove(Testimonial testimonial);
}
