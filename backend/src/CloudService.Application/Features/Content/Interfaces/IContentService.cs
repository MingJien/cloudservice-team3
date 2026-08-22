using CloudService.Application.Common.Models;
using CloudService.Application.Features.Content.Models;

namespace CloudService.Application.Features.Content.Interfaces;

public interface IContentService
{
    Task<PagedResult<NewsCategoryItem>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken);
    Task<NewsCategoryItem> CreateCategoryAsync(NewsCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<NewsCategoryItem> UpdateCategoryAsync(int id, NewsCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeactivateCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task PermanentlyDeleteCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<NewsCategoryItem> SetCategoryStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<NewsArticleItem>> GetArticlesAsync(NewsListQuery query, CancellationToken cancellationToken);
    Task<NewsArticleItem> GetArticleBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<NewsArticleItem> CreateArticleAsync(NewsArticleRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<NewsArticleItem> UpdateArticleAsync(int id, NewsArticleRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeactivateArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task PermanentlyDeleteArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<NewsArticleItem> RestoreArticleAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<TestimonialItem>> GetTestimonialsAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken);
    Task<TestimonialItem> CreateTestimonialAsync(TestimonialRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<TestimonialItem> UpdateTestimonialAsync(int id, TestimonialRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeactivateTestimonialAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task PermanentlyDeleteTestimonialAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<TestimonialItem> SetTestimonialStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<ContactRequestItem> CreateContactAsync(CreateContactRequest request, CancellationToken cancellationToken);
    Task<PublicContactStatusItem> GetContactStatusAsync(string trackingCode, CancellationToken cancellationToken);
    Task<PagedResult<ContactRequestItem>> GetContactsAsync(ContactListQuery query, CancellationToken cancellationToken);
    Task UpdateContactStatusAsync(long id, UpdateContactStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task ReplyToContactAsync(long id, ReplyContactRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
}
