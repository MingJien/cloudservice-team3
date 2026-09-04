using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Content.Models;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Content;

public sealed class ContentService(IContentRepository repository, IOrderRepository orderRepository, IUnitOfWork unitOfWork, TimeProvider timeProvider) : IContentService
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

    public async Task<PagedResult<TestimonialItem>> GetTestimonialsAsync(int pageNumber, int pageSize, bool includeInactive, bool verifiedOnly, CancellationToken cancellationToken)
    {
        ValidatePaging(pageNumber, pageSize);
        var result = await repository.GetTestimonialsAsync(pageNumber, pageSize, includeInactive, verifiedOnly, cancellationToken);
        return PagedResult<TestimonialItem>.Create(result.Items.Select(Map), pageNumber, pageSize, result.TotalCount);
    }

    public async Task<TestimonialItem> SetTestimonialStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var testimonial = await repository.GetTestimonialAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đánh giá.");
        if ((isActive && testimonial.ModerationStatus == TestimonialModerationStatus.Published) ||
            (!isActive && testimonial.ModerationStatus == TestimonialModerationStatus.Hidden))
            return Map(testimonial);
        if (isActive && !testimonial.IsVerifiedOrder)
            throw new ConflictException("Không thể công bố bản ghi do quản trị tự tạo. Chỉ đánh giá từ đơn hoàn tất đã xác minh mới hợp lệ.");

        if (isActive) testimonial.SetActive(true); else testimonial.Hide();
        await SaveAudit(isActive ? "Content.TestimonialApproved" : "Content.TestimonialHidden", nameof(Testimonial), testimonial.Id.ToString(), userId, ipAddress, cancellationToken);
        return Map(testimonial);
    }

    public async Task<TestimonialSubmissionResult> SubmitTestimonialAsync(SubmitTestimonialRequest request, CancellationToken cancellationToken)
    {
        if (!request.ConsentToPublish)
        {
            throw new RequestValidationException(nameof(request.ConsentToPublish), "Bạn cần đồng ý cho phép kiểm duyệt và công bố phản hồi trước khi gửi.");
        }

        var trackingCode = request.TrackingCode.Trim().ToUpperInvariant();
        var order = await orderRepository.GetByTrackingCodeAsync(trackingCode, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy đơn hàng phù hợp.");

        if (order.Status != OrderRequestStatus.Done)
        {
            throw new ConflictException("Đánh giá chỉ mở sau khi đơn hàng đã hoàn tất.");
        }

        if (await repository.TestimonialExistsForOrderAsync(order.Id, cancellationToken))
        {
            throw new ConflictException("Đơn hàng này đã gửi đánh giá trước đó.");
        }

        var testimonial = Testimonial.CreateFromCompletedOrder(order, request.Content, request.Rating);
        repository.Add(testimonial);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new TestimonialSubmissionResult(
            testimonial.Id,
            IsPendingModeration: true,
            testimonial.IsFeaturedCustomer,
            "Đánh giá đã được tiếp nhận và đang chờ quản trị viên kiểm duyệt.");
    }

    public async Task<ContactRequestItem> CreateContactAsync(CreateContactRequest request, CancellationToken cancellationToken)
    {
        ContactRequest? parent = null;
        if (request.ParentContactRequestId is not null)
        {
            parent = await repository.GetContactAsync(request.ParentContactRequestId.Value, cancellationToken)
                ?? throw new ResourceNotFoundException("Câu hỏi gốc không tồn tại.");
            if (parent.ParentContactRequestId is not null || parent.Status != ContactRequestStatus.Replied || string.IsNullOrWhiteSpace(parent.AdminReply))
                throw new ConflictException("Chỉ có thể hỏi tiếp từ một câu hỏi gốc đã được đội ngũ trả lời.");
        }

        var trackingCode = $"REQ-{timeProvider.GetUtcNow():yyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        var contact = new ContactRequest(trackingCode, request.FullName, request.Email, parent?.Subject ?? request.Subject, request.Message);
        contact.SetPhone(request.Phone);
        if (parent is not null) contact.AttachToPublicQuestion(parent);
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

    public async Task<PagedResult<PublicQnAItem>> GetPublicQnAsAsync(PublicQnAQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetPublicQnAsAsync(query.PageNumber, query.PageSize, query.Subject, cancellationToken);
        return PagedResult<PublicQnAItem>.Create(result.Items.Select(MapPublic), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<PublicContactStatusItem> GetContactStatusAsync(string trackingCode, CancellationToken cancellationToken)
    {
        var normalized = trackingCode.Trim().ToUpperInvariant();
        if (normalized.Length < 10 || normalized.Length > 32)
            throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");

        var contact = await repository.GetContactByTrackingCodeAsync(normalized, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");
        return new PublicContactStatusItem(contact.TrackingCode, contact.Subject, contact.Status, contact.AdminReply, contact.RepliedByRole, contact.CreatedAt, contact.RepliedAt);
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

    public async Task ReplyToContactAsync(long id, ReplyContactRequest request, ContactResponderRole responderRole, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var contact = await repository.GetContactAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu liên hệ.");
        contact.Reply(request.Reply, responderRole);
        await SaveAudit("Content.ContactReplied", nameof(ContactRequest), contact.Id.ToString(), userId, ipAddress, cancellationToken, new { contact.Status, contact.RepliedAt, contact.RepliedByRole });
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
    internal static TestimonialItem Map(Testimonial item) => new(
        item.Id,
        item.CustomerName,
        item.CompanyName,
        item.Position,
        item.Content,
        item.AvatarUrl,
        item.LogoUrl,
        item.Rating,
        item.DisplayOrder,
        item.IsActive,
        item.IsVerifiedOrder,
        item.IsFeaturedCustomer,
        item.OrderRequest is null ? null : MaskOrderReference(item.OrderRequest.TrackingCode),
        item.OrderRequest?.PlanNameSnapshot,
        item.OrderRequest?.ServicePlan?.Category?.Name,
        item.ModerationStatus,
        item.CreatedAt);
    internal static ContactRequestItem Map(ContactRequest item) => new(item.Id, item.TrackingCode, item.FullName, item.Email, item.Phone, item.Subject, item.Message, item.AdminReply, item.RepliedByRole, item.Status, item.CreatedAt, item.UpdatedAt, item.RepliedAt, item.ParentContactRequestId, item.Parent?.Subject, item.FollowUps.Count);

    private static string MaskName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "Khách";
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var name = parts[^1];
        if (name.Length <= 2) return name[0] + "***";
        return $"{name[..2]}***{name[^1..]}";
    }

    private static string MaskOrderReference(string trackingCode)
    {
        // Tracking codes are sufficient to retrieve order status elsewhere in the
        // product, so public reviews expose only a human-readable reference rather
        // than accidentally turning a customer testimonial into a tracking token leak.
        if (trackingCode.Length <= 5) return "Đơn đã hoàn tất";
        var suffix = trackingCode[^Math.Min(3, trackingCode.Length)..].TrimStart('-');
        return $"Đơn {trackingCode[..3]}-••••-{suffix}";
    }

    internal static PublicQnAItem MapPublic(ContactRequest item) => new(
        item.Id,
        MaskName(item.FullName),
        item.Subject,
        item.Message,
        item.AdminReply ?? string.Empty,
        item.RepliedByRole,
        item.CreatedAt,
        item.RepliedAt,
        item.FollowUps
            .Where(followUp => followUp.Status == ContactRequestStatus.Replied && !string.IsNullOrWhiteSpace(followUp.AdminReply))
            .OrderBy(followUp => followUp.CreatedAt)
            .Select(followUp => new PublicQnAFollowUpItem(
                followUp.Id,
                MaskName(followUp.FullName),
                followUp.Message,
                followUp.AdminReply!,
                followUp.RepliedByRole,
                followUp.CreatedAt,
                followUp.RepliedAt))
            .ToArray());
}
