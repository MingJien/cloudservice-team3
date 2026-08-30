using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Content.Models;
using CloudService.Domain.Constants;
using CloudService.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api")]
public sealed class ContentController(IContentService service, IWebHostEnvironment env) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("news-categories")]
    public Task<PagedResult<NewsCategoryItem>> GetNewsCategories([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 50, CancellationToken cancellationToken = default) => service.GetCategoriesAsync(pageNumber, pageSize, false, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet("admin/news-categories")]
    public Task<PagedResult<NewsCategoryItem>> GetAdminNewsCategories([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 100, CancellationToken cancellationToken = default) => service.GetCategoriesAsync(pageNumber, pageSize, true, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPost("news-categories")]
    public async Task<ActionResult<NewsCategoryItem>> CreateNewsCategory(NewsCategoryRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateCategoryAsync(request, UserId(), ClientIp(), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPut("news-categories/{id:int}")]
    public Task<NewsCategoryItem> UpdateNewsCategory(int id, NewsCategoryRequest request, CancellationToken cancellationToken) => service.UpdateCategoryAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("news-categories/{id:int}")]
    public async Task<IActionResult> DeleteNewsCategory(int id, CancellationToken cancellationToken)
    {
        await service.DeactivateCategoryAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("news-categories/{id:int}/hard")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> HardDeleteNewsCategory(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeleteCategoryAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("news-categories/{id:int}/status")]
    public Task<NewsCategoryItem> SetNewsCategoryStatus(int id, ContentStatusRequest request, CancellationToken cancellationToken) =>
        service.SetCategoryStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [AllowAnonymous]
    [HttpGet("news-articles")]
    public Task<PagedResult<NewsArticleItem>> GetArticles([FromQuery] NewsListQuery query, CancellationToken cancellationToken) => service.GetArticlesAsync(query with { IncludeUnpublished = false }, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet("admin/news-articles")]
    public Task<PagedResult<NewsArticleItem>> GetAdminArticles([FromQuery] NewsListQuery query, CancellationToken cancellationToken) => service.GetArticlesAsync(query with { IncludeUnpublished = true }, cancellationToken);

    [AllowAnonymous]
    [HttpGet("news-articles/{slug}")]
    public Task<NewsArticleItem> GetArticle(string slug, CancellationToken cancellationToken) => service.GetArticleBySlugAsync(slug, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPost("news-articles")]
    public async Task<ActionResult<NewsArticleItem>> CreateArticle(NewsArticleRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateArticleAsync(request, UserId(), ClientIp(), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPut("news-articles/{id:int}")]
    public Task<NewsArticleItem> UpdateArticle(int id, NewsArticleRequest request, CancellationToken cancellationToken) => service.UpdateArticleAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("news-articles/{id:int}")]
    public async Task<IActionResult> DeleteArticle(int id, CancellationToken cancellationToken)
    {
        await service.DeactivateArticleAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("news-articles/{id:int}/hard")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> HardDeleteArticle(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeleteArticleAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("news-articles/{id:int}/restore")]
    public Task<NewsArticleItem> RestoreArticle(int id, CancellationToken cancellationToken) =>
        service.RestoreArticleAsync(id, UserId(), ClientIp(), cancellationToken);

    [AllowAnonymous]
    [HttpGet("testimonials")]
    public Task<PagedResult<TestimonialItem>> GetTestimonials([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) => service.GetTestimonialsAsync(pageNumber, pageSize, false, true, cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("admin/testimonials")]
    public Task<PagedResult<TestimonialItem>> GetAdminTestimonials([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) => service.GetTestimonialsAsync(pageNumber, pageSize, true, false, cancellationToken);

    [AllowAnonymous]
    [EnableRateLimiting("testimonial-submit")]
    [HttpPost("testimonials/submissions")]
    [ProducesResponseType<TestimonialSubmissionResult>(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestimonialSubmissionResult>> SubmitTestimonial(SubmitTestimonialRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SubmitTestimonialAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("testimonials/{id:int}/status")]
    public Task<TestimonialItem> SetTestimonialStatus(int id, ContentStatusRequest request, CancellationToken cancellationToken) =>
        service.SetTestimonialStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [AllowAnonymous]
    [EnableRateLimiting("contact-submit")]
    [HttpPost("contact-requests")]
    public async Task<ActionResult<ContactRequestItem>> CreateContact(CreateContactRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateContactAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [AllowAnonymous]
    [HttpGet("contact-requests/tracking/{trackingCode}")]
    public Task<PublicContactStatusItem> GetContactStatus(string trackingCode, CancellationToken cancellationToken) =>
        service.GetContactStatusAsync(trackingCode, cancellationToken);

    [AllowAnonymous]
    [HttpGet("public/qna")]
    public Task<PagedResult<PublicQnAItem>> GetPublicQnAs([FromQuery] PublicQnAQuery query, CancellationToken cancellationToken) =>
        service.GetPublicQnAsAsync(query, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet("contact-requests")]
    public Task<PagedResult<ContactRequestItem>> GetContacts([FromQuery] ContactListQuery query, CancellationToken cancellationToken) => service.GetContactsAsync(query, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("contact-requests/{id:long}/status")]
    public async Task<IActionResult> UpdateContactStatus(long id, UpdateContactStatusRequest request, CancellationToken cancellationToken)
    {
        await service.UpdateContactStatusAsync(id, request, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("contact-requests/{id:long}/reply")]
    public async Task<IActionResult> ReplyToContact(long id, ReplyContactRequest request, CancellationToken cancellationToken)
    {
        var responderRole = User.IsInRole(RoleNames.Admin)
            ? ContactResponderRole.Admin
            : ContactResponderRole.Editor;
        await service.ReplyToContactAsync(id, request, responderRole, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPost("content/upload-image")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Không có tệp được tải lên.");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("Chỉ hỗ trợ tệp ảnh (jpg, png, gif, webp).");

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("Kích thước tệp không được vượt quá 5MB.");

        var uploadsFolder = Path.Combine(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{uniqueFileName}";
        return Ok(new { url });
    }
}
