using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Content.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Content;

public sealed class ContentService(IContentRepository repository, IUnitOfWork unitOfWork, TimeProvider timeProvider) : IContentService
{
    public async Task<PagedResult<NewsCategoryItem>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken)
    {
        ValidatePaging(pageNumber, pageSize);
        var result = await repository.GetCategoriesAsync(pageNumber, pageSize, includeInactive, cancellationToken);
        return PagedResult<NewsCategoryItem>.Create(result.Items.Select(Map), pageNumber, pageSize, result.TotalCount);
    }

    public async Task<NewsCategoryItem> CreateCategoryAsync(NewsCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, null, cancellationToken)) throw Conflict("Slug danh mục tin đã tồn tại.");
        var category = new NewsCategory(request.Name, slug);
        category.Update(request.Name, slug, request.Description);
        repository.Add(category);
        await SaveAudit("Content.NewsCategoryCreated", nameof(NewsCategory), category.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(category);
    }

    public async Task<NewsCategoryItem> UpdateCategoryAsync(int id, NewsCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục tin.");
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, id, cancellationToken)) throw Conflict("Slug danh mục tin đã tồn tại.");
        category.Update(request.Name, slug, request.Description);
        await SaveAudit("Content.NewsCategoryUpdated", nameof(NewsCategory), category.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(category);
    }

    public async Task DeactivateCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetCategoryStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeleteCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục.");
        repository.Remove(category);
        await SaveAudit("Content.NewsCategoryHardDeleted", nameof(NewsCategory), category.Id.ToString(), userId, ipAddress, cancellationToken);
    }

    public async Task<NewsCategoryItem> SetCategoryStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục tin.");
        if (category.IsActive == isActive) return Map(category);
        category.SetActive(isActive);
        await SaveAudit(isActive ? "Content.NewsCategoryRestored" : "Content.NewsCategoryDeactivated", nameof(NewsCategory), category.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(category);
    }

    public async Task<PagedResult<NewsArticleItem>> GetArticlesAsync(NewsListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetArticlesAsync(query.PageNumber, query.PageSize, query.Search, query.CategorySlug, query.IncludeUnpublished, cancellationToken);
        return PagedResult<NewsArticleItem>.Create(result.Items.Select(Map), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<NewsArticleItem> GetArticleBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var article = await repository.GetArticleBySlugAsync(NormalizeSlug(slug), false, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bài viết.");
        article.IncrementViewCount();
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(article);
    }

    public async Task<NewsArticleItem> CreateArticleAsync(NewsArticleRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await EnsureCategory(request.CategoryId, cancellationToken);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.ArticleSlugExistsAsync(slug, null, cancellationToken)) throw Conflict("Slug bài viết đã tồn tại.");
        var article = new NewsArticle(request.CategoryId, request.Title, slug, request.Content);
        article.Update(request.CategoryId, request.Title, slug, request.Summary, request.Content, request.ThumbnailUrl, request.AuthorName);
        if (request.IsPublished) article.Publish(timeProvider.GetUtcNow().UtcDateTime);
        repository.Add(article);
        await SaveAudit("Content.NewsArticleCreated", nameof(NewsArticle), article.Id.ToString(), userId, ipAddress, cancellationToken, request);
        return Map(await repository.GetArticleAsync(article.Id, cancellationToken) ?? article);
    }

    public async Task<NewsArticleItem> UpdateArticleAsync(int id, NewsArticleRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await EnsureCategory(request.CategoryId, cancellationToken);
        var article = await repository.GetArticleAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bài viết.");
        var slug = NormalizeSlug(request.Slug);
        if (await repository.ArticleSlugExistsAsync(slug, id, cancellationToken)) throw Conflict("Slug bài viết đã tồn tại.");
        article.Update(request.CategoryId, request.Title, slug, request.Summary, request.Content, request.ThumbnailUrl, request.AuthorName);
        if (request.IsPublished) article.Publish(article.PublishedAt ?? timeProvider.GetUtcNow().UtcDateTime); else article.Unpublish();
        await SaveAudit("Content.NewsArticleUpdated", nameof(NewsArticle), article.Id.ToString(), userId, ipAddress, cancellationToken, request);
        return Map(article);
    }

    public async Task DeactivateArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var article = await repository.GetArticleAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bài viết.");
        if (article.IsDeleted) return;
        article.SoftDelete();
        await SaveAudit("Content.NewsArticleSoftDeleted", nameof(NewsArticle), article.Id.ToString(), userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeleteArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var article = await repository.GetArticleAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bài viết.");
        repository.Remove(article);
        await SaveAudit("Content.NewsArticleHardDeleted", nameof(NewsArticle), article.Id.ToString(), userId, ipAddress, cancellationToken);
    }

    public async Task<NewsArticleItem> RestoreArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var article = await repository.GetArticleAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bài viết.");
        if (!article.IsDeleted) return Map(article);
        article.Restore();
        await SaveAudit("Content.NewsArticleRestoredAsDraft", nameof(NewsArticle), article.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(article);
    }

    public async Task<PagedResult<TestimonialItem>> GetTestimonialsAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken)
    {
        ValidatePaging(pageNumber, pageSize);
        var result = await repository.GetTestimonialsAsync(pageNumber, pageSize, includeInactive, cancellationToken);
        return PagedResult<TestimonialItem>.Create(result.Items.Select(Map), pageNumber, pageSize, result.TotalCount);
    }

    public async Task<TestimonialItem> CreateTestimonialAsync(TestimonialRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var testimonial = new Testimonial(request.CustomerName, request.Content, request.Rating, request.DisplayOrder);
        testimonial.Update(request.CustomerName, request.CompanyName, request.Position, request.Content, request.AvatarUrl, request.LogoUrl, request.Rating, request.DisplayOrder);
        repository.Add(testimonial);
        await SaveAudit("Content.TestimonialCreated", nameof(Testimonial), testimonial.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(testimonial);
    }

    public async Task<TestimonialItem> UpdateTestimonialAsync(int id, TestimonialRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var testimonial = await repository.GetTestimonialAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đánh giá.");
        testimonial.Update(request.CustomerName, request.CompanyName, request.Position, request.Content, request.AvatarUrl, request.LogoUrl, request.Rating, request.DisplayOrder);
        await SaveAudit("Content.TestimonialUpdated", nameof(Testimonial), testimonial.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(testimonial);
    }

    public async Task DeactivateTestimonialAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetTestimonialStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeleteTestimonialAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var testimonial = await repository.GetTestimonialAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đánh giá.");
        repository.Remove(testimonial);
        await SaveAudit("Content.TestimonialHardDeleted", nameof(Testimonial), testimonial.Id.ToString(), userId, ipAddress, cancellationToken);
    }

    public async Task<TestimonialItem> SetTestimonialStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var testimonial = await repository.GetTestimonialAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đánh giá.");
        if (testimonial.IsActive == isActive) return Map(testimonial);
        testimonial.SetActive(isActive);
        await SaveAudit(isActive ? "Content.TestimonialRestored" : "Content.TestimonialDeactivated", nameof(Testimonial), testimonial.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(testimonial);
    }

    public async Task<ContactRequestItem> CreateContactAsync(CreateContactRequest request, CancellationToken cancellationToken)
    {
        var contact = new ContactRequest(request.FullName, request.Email, request.Subject, request.Message);
        contact.SetPhone(request.Phone);
        repository.Add(contact);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(contact);
    }

    public async Task<PagedResult<ContactRequestItem>> GetContactsAsync(ContactListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetContactsAsync(query.PageNumber, query.PageSize, query.Status, query.Search, cancellationToken);
        return PagedResult<ContactRequestItem>.Create(result.Items.Select(Map), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<PublicContactStatusItem> GetContactStatusAsync(string trackingCode, CancellationToken cancellationToken)
    {
        var normalized = trackingCode.Trim().ToLowerInvariant();
        if (normalized.Length != 32 || normalized.Any(character => !Uri.IsHexDigit(character)))
            throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");

        var contact = await repository.GetContactByTrackingCodeAsync(normalized, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");
        return new PublicContactStatusItem(contact.TrackingCode, contact.Subject, contact.Status, contact.AdminReply, contact.CreatedAt, contact.RepliedAt);
    }

    public async Task UpdateContactStatusAsync(long id, UpdateContactStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status)) throw new RequestValidationException(nameof(request.Status), "Trạng thái không hợp lệ.");
        var contact = await repository.GetContactAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");
        try
        {
            contact.ChangeStatus(request.Status);
        }
        catch (InvalidOperationException exception)
        {
            throw new ConflictException(exception.Message);
        }
        await SaveAudit("Content.ContactStatusChanged", nameof(ContactRequest), contact.Id.ToString(), userId, ipAddress, cancellationToken);
    }

    public async Task ReplyToContactAsync(long id, ReplyContactRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var contact = await repository.GetContactAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");
        contact.Reply(request.Reply);
        await SaveAudit("Content.ContactReplied", nameof(ContactRequest), contact.Id.ToString(), userId, ipAddress, cancellationToken, new { contact.Status, contact.RepliedAt });
    }

    private async Task EnsureCategory(int id, CancellationToken cancellationToken)
    {
        if (id <= 0 || await repository.GetCategoryAsync(id, cancellationToken) is not { IsActive: true }) throw new ResourceNotFoundException("Danh mục tin không tồn tại hoặc đã vô hiệu hóa.");
    }

    private async Task SaveAudit(string action, string entityName, string entityId, int userId, string? ipAddress, CancellationToken cancellationToken, object? newValues = null)
    {
        unitOfWork.AddAuditLog(new AuditLog(action, userId, entityName, entityId, newValues: newValues is null ? null : JsonSerializer.Serialize(newValues), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber < 1 || pageSize is < 1 or > 100) throw new RequestValidationException("paging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100.");
    }

    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant();
    private static RequestValidationException Conflict(string message) => new("conflict", message);

    internal static NewsCategoryItem Map(NewsCategory item) => new(item.Id, item.Name, item.Slug, item.Description, item.IsActive, item.Articles.Count(article => article.IsPublished), item.Articles.Count);
    internal static NewsArticleItem Map(NewsArticle item) => new(item.Id, item.CategoryId, item.Category?.Name ?? string.Empty, item.Category?.Slug ?? string.Empty, item.Title, item.Slug, item.Summary, item.Content, item.ThumbnailUrl, item.AuthorName, item.PublishedAt, item.IsPublished, item.IsDeleted, item.ViewCount, item.CreatedAt, item.UpdatedAt);
    internal static TestimonialItem Map(Testimonial item) => new(item.Id, item.CustomerName, item.CompanyName, item.Position, item.Content, item.AvatarUrl, item.LogoUrl, item.Rating, item.DisplayOrder, item.IsActive);
    internal static ContactRequestItem Map(ContactRequest item) => new(item.Id, item.TrackingCode, item.FullName, item.Email, item.Phone, item.Subject, item.Message, item.AdminReply, item.Status, item.CreatedAt, item.UpdatedAt, item.RepliedAt);
}
