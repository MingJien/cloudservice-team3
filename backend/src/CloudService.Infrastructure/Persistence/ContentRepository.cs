using CloudService.Application.Common.Models;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class ContentRepository(ApplicationDbContext dbContext) : IContentRepository
{
    public async Task<PagedResult<NewsCategory>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken)
    {
        var query = dbContext.NewsCategories.AsNoTracking().Include(item => item.Articles).Where(item => includeInactive || item.IsActive).OrderBy(item => item.Name);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<NewsCategory>.Create(items, pageNumber, pageSize, total);
    }

    public Task<NewsCategory?> GetCategoryAsync(int id, CancellationToken cancellationToken) => dbContext.NewsCategories.Include(item => item.Articles).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    public Task<bool> CategorySlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) => dbContext.NewsCategories.AnyAsync(item => item.Slug == slug && (exceptId == null || item.Id != exceptId), cancellationToken);

    public async Task<PagedResult<NewsArticle>> GetArticlesAsync(int pageNumber, int pageSize, string? search, string? categorySlug, bool includeUnpublished, CancellationToken cancellationToken)
    {
        var normalizedSearch = search?.Trim().ToUpperInvariant();
        var normalizedCategory = categorySlug?.Trim().ToLowerInvariant();
        var source = includeUnpublished
            ? dbContext.NewsArticles.IgnoreQueryFilters()
            : dbContext.NewsArticles;
        var query = source.AsNoTracking().Include(item => item.Category).Where(item => (includeUnpublished || item.IsPublished) && (includeUnpublished || item.Category.IsActive));
        if (!string.IsNullOrWhiteSpace(normalizedSearch)) query = query.Where(item => item.Title.ToUpper().Contains(normalizedSearch) || (item.Summary ?? string.Empty).ToUpper().Contains(normalizedSearch));
        if (!string.IsNullOrWhiteSpace(normalizedCategory)) query = query.Where(item => item.Category.Slug == normalizedCategory);
        var ordered = query.OrderByDescending(item => item.PublishedAt ?? item.CreatedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<NewsArticle>.Create(items, pageNumber, pageSize, total);
    }

    public Task<NewsArticle?> GetArticleBySlugAsync(string slug, bool includeUnpublished, CancellationToken cancellationToken) =>
        (includeUnpublished ? dbContext.NewsArticles.IgnoreQueryFilters() : dbContext.NewsArticles)
            .Include(item => item.Category)
            .SingleOrDefaultAsync(item => item.Slug == slug && (includeUnpublished || (item.IsPublished && item.Category.IsActive)), cancellationToken);

    public Task<NewsArticle?> GetArticleAsync(int id, CancellationToken cancellationToken) => dbContext.NewsArticles.IgnoreQueryFilters().Include(item => item.Category).SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    public Task<bool> ArticleSlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) => dbContext.NewsArticles.IgnoreQueryFilters().AnyAsync(item => item.Slug == slug && (exceptId == null || item.Id != exceptId), cancellationToken);

    public async Task<PagedResult<Testimonial>> GetTestimonialsAsync(int pageNumber, int pageSize, bool includeInactive, bool verifiedOnly, CancellationToken cancellationToken)
    {
        // Filtering in the database, rather than after pagination in the UI,
        // keeps the public proof feed limited to completed-order submissions.
        // Pending moderation is deliberately sorted first for the admin queue.
        var query = dbContext.Testimonials.AsNoTracking()
            .Include(item => item.OrderRequest)
                .ThenInclude(order => order!.ServicePlan)
                    .ThenInclude(plan => plan.Category)
            .Where(item => (includeInactive || item.IsActive) && (!verifiedOnly || item.IsVerifiedOrder))
            .OrderByDescending(item => includeInactive && item.ModerationStatus == TestimonialModerationStatus.Pending)
            .ThenByDescending(item => item.CreatedAt);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<Testimonial>.Create(items, pageNumber, pageSize, total);
    }

    public Task<Testimonial?> GetTestimonialAsync(int id, CancellationToken cancellationToken) => dbContext.Testimonials.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    public Task<bool> TestimonialExistsForOrderAsync(long orderRequestId, CancellationToken cancellationToken) =>
        dbContext.Testimonials.AnyAsync(item => item.OrderRequestId == orderRequestId, cancellationToken);

    public async Task<PagedResult<ContactRequest>> GetContactsAsync(int pageNumber, int pageSize, ContactRequestStatus? status, string? search, CancellationToken cancellationToken)
    {
        var normalized = search?.Trim().ToUpperInvariant();
        var query = dbContext.ContactRequests.AsNoTracking().Include(item => item.Parent).Include(item => item.FollowUps).AsQueryable();
        if (status is not null) query = query.Where(item => item.Status == status);
        if (!string.IsNullOrWhiteSpace(normalized)) query = query.Where(item => item.FullName.ToUpper().Contains(normalized) || item.Email.ToUpper().Contains(normalized) || item.Subject.ToUpper().Contains(normalized));
        var ordered = query.OrderByDescending(item => item.CreatedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<ContactRequest>.Create(items, pageNumber, pageSize, total);
    }

    public async Task<PagedResult<ContactRequest>> GetPublicQnAsAsync(int pageNumber, int pageSize, string? subject, CancellationToken cancellationToken)
    {
        var normalized = subject?.Trim().ToUpperInvariant();
        IQueryable<ContactRequest> query = dbContext.ContactRequests
            .AsNoTracking()
            .Where(item => item.ParentContactRequestId == null && item.Status == ContactRequestStatus.Replied)
            .Include(item => item.FollowUps.Where(followUp => followUp.Status == ContactRequestStatus.Replied));
        if (!string.IsNullOrWhiteSpace(normalized))
            query = query.Where(item => item.Subject.ToUpper().Contains(normalized));

        var ordered = query.OrderByDescending(item => item.RepliedAt ?? item.CreatedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<ContactRequest>.Create(items, pageNumber, pageSize, total);
    }

    public Task<ContactRequest?> GetContactAsync(long id, CancellationToken cancellationToken) => dbContext.ContactRequests.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    public Task<ContactRequest?> GetContactByTrackingCodeAsync(string trackingCode, CancellationToken cancellationToken) =>
        dbContext.ContactRequests.AsNoTracking().SingleOrDefaultAsync(item => item.TrackingCode == trackingCode, cancellationToken);
    public void Add(NewsCategory category) => dbContext.NewsCategories.Add(category);
    public void Add(NewsArticle article) => dbContext.NewsArticles.Add(article);
    public void Add(Testimonial testimonial) => dbContext.Testimonials.Add(testimonial);
    public void Add(ContactRequest request) => dbContext.ContactRequests.Add(request);
    public void Remove(NewsCategory category) => dbContext.NewsCategories.Remove(category);
    public void Remove(NewsArticle article) => dbContext.NewsArticles.Remove(article);
}
