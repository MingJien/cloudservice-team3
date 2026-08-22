using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Application.Features.Services.Models;
using CloudService.Domain.Constants;
using CloudService.WebApi.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api")]
public sealed class ServiceCatalogController(
    IServiceCatalogService service,
    IConfiguration configuration,
    IWebHostEnvironment environment) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("service-categories")]
    [ProducesResponseType<PagedResult<ServiceCategoryItem>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ServiceCategoryItem>> GetCategories([FromQuery] ServiceCategoryListQuery query, CancellationToken cancellationToken) =>
        service.GetCategoriesAsync(query with { IncludeInactive = User.IsInRole(RoleNames.Admin) ? query.IncludeInactive : false }, cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("service-categories")]
    [ProducesResponseType<ServiceCategoryItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ServiceCategoryItem>> CreateCategory(ServiceCategoryRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateCategoryAsync(request, UserId(), ClientIp(), cancellationToken);
        return Created($"/api/service-categories/{item.Id}", item);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("service-categories/{id:int}")]
    [ProducesResponseType<ServiceCategoryItem>(StatusCodes.Status200OK)]
    public Task<ServiceCategoryItem> UpdateCategory(int id, ServiceCategoryRequest request, CancellationToken cancellationToken) =>
        service.UpdateCategoryAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("service-categories/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCategory(int id, CancellationToken cancellationToken)
    {
        await service.DeleteCategoryAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("service-categories/{id:int}/hard")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> HardDeleteCategory(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeleteCategoryAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("service-categories/{id:int}/status")]
    public Task<ServiceCategoryItem> SetCategoryStatus(int id, EntityStatusRequest request, CancellationToken cancellationToken) =>
        service.SetCategoryStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("service-categories/{id:int}/restore")]
    public Task<ServiceCategoryItem> RestoreCategory(int id, CancellationToken cancellationToken) =>
        service.SetCategoryStatusAsync(id, true, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("service-categories/{id:int}/disable-impact")]
    public Task<CategoryDisableImpact> GetCategoryDisableImpact(int id, CancellationToken cancellationToken) =>
        service.GetCategoryDisableImpactAsync(id, cancellationToken);

    [AllowAnonymous]
    [HttpGet("service-plans")]
    [ProducesResponseType<PagedResult<ServicePlanItem>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ServicePlanItem>> GetPublicPlans([FromQuery] ServicePlanListQuery query, CancellationToken cancellationToken) =>
        service.GetPublicPlansAsync(query with { IncludeInactive = false }, cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("admin/service-plans")]
    [ProducesResponseType<PagedResult<ServicePlanItem>>(StatusCodes.Status200OK)]
    public Task<PagedResult<ServicePlanItem>> GetAdminPlans([FromQuery] ServicePlanListQuery query, CancellationToken cancellationToken) =>
        service.GetPlansAsync(query with { IncludeInactive = true }, cancellationToken);

    [AllowAnonymous]
    [HttpGet("service-plans/{idOrSlug}")]
    [ProducesResponseType<ServicePlanItem>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ServicePlanItem>> GetPlan(string idOrSlug, CancellationToken cancellationToken)
    {
        if (int.TryParse(idOrSlug, out var id))
            return Ok(await service.GetPublicPlanByIdAsync(id, cancellationToken));
        return Ok(await service.GetPublicPlanAsync(idOrSlug, cancellationToken));
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("service-plans")]
    [ProducesResponseType<ServicePlanItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ServicePlanItem>> CreatePlan(ServicePlanRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreatePlanAsync(request, UserId(), ClientIp(), cancellationToken);
        return CreatedAtAction(nameof(GetPlan), new { idOrSlug = item.Slug }, item);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("service-plan-images")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadPlanImage(IFormFile file, CancellationToken cancellationToken)
    {
        var validation = await ImageUploadValidator.ValidateAsync(file, 5 * 1024 * 1024, "Ảnh gói dịch vụ", cancellationToken);
        if (validation.Error is not null)
            return BadRequest(new ProblemDetails { Title = validation.Error });
        var extension = validation.Extension!;

        var webRoot = environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "plan-images");
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"plan_{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
        await using var stream = new FileStream(filePath, FileMode.CreateNew);
        await file.CopyToAsync(stream, cancellationToken);

        return Ok(new { imageUrl = $"/plan-images/{uniqueFileName}" });
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("service-plans/{id:int}")]
    public Task<ServicePlanItem> UpdatePlan(int id, ServicePlanRequest request, CancellationToken cancellationToken) =>
        service.UpdatePlanAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("service-plans/{id:int}")]
    public async Task<IActionResult> DeletePlan(int id, CancellationToken cancellationToken)
    {
        await service.DeletePlanAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("service-plans/{id:int}/hard")]
    public async Task<IActionResult> HardDeletePlan(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeletePlanAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("service-plans/{id:int}/status")]
    public Task<ServicePlanItem> SetPlanStatus(int id, EntityStatusRequest request, CancellationToken cancellationToken) =>
        service.SetPlanStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("service-plans/{id:int}/restore")]
    public Task<ServicePlanItem> RestorePlan(int id, CancellationToken cancellationToken) =>
        service.SetPlanStatusAsync(id, true, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("plan-prices")]
    [ProducesResponseType<PlanPriceItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<PlanPriceItem>> CreatePrice([FromQuery] int servicePlanId, PlanPriceRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreatePriceAsync(servicePlanId, request, UserId(), ClientIp(), cancellationToken);
        return CreatedAtAction(nameof(GetPlan), new { idOrSlug = servicePlanId }, item);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("plan-prices/{id:int}")]
    public Task<PlanPriceItem> UpdatePrice(int id, PlanPriceRequest request, CancellationToken cancellationToken) =>
        service.UpdatePriceAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("plan-prices/{id:int}")]
    public async Task<IActionResult> DeletePrice(int id, CancellationToken cancellationToken)
    {
        await service.DeletePriceAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("plan-prices/{id:int}/hard")]
    public async Task<IActionResult> HardDeletePrice(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeletePriceAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("plan-prices/{id:int}/status")]
    public Task<PlanPriceItem> SetPriceStatus(int id, EntityStatusRequest request, CancellationToken cancellationToken) =>
        service.SetPriceStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("plan-prices/{id:int}/restore")]
    public Task<PlanPriceItem> RestorePrice(int id, CancellationToken cancellationToken) =>
        service.SetPriceStatusAsync(id, true, UserId(), ClientIp(), cancellationToken);

    [AllowAnonymous]
    [HttpGet("promotions")]
    [ProducesResponseType<IReadOnlyCollection<PromotionItem>>(StatusCodes.Status200OK)]
    public Task<IReadOnlyCollection<PromotionItem>> GetPromotions(CancellationToken cancellationToken) => service.GetPromotionsAsync(false, cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("admin/promotions")]
    public Task<IReadOnlyCollection<PromotionItem>> GetAdminPromotions(CancellationToken cancellationToken) => service.GetPromotionsAsync(true, cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("promotions")]
    [ProducesResponseType<PromotionItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<PromotionItem>> CreatePromotion(PromotionRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreatePromotionAsync(request, UserId(), ClientIp(), cancellationToken);
        return Created($"/api/promotions/{item.Id}", item);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPut("promotions/{id:int}")]
    public Task<PromotionItem> UpdatePromotion(int id, PromotionRequest request, CancellationToken cancellationToken) =>
        service.UpdatePromotionAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("promotions/{id:int}")]
    public async Task<IActionResult> DeletePromotion(int id, CancellationToken cancellationToken)
    {
        await service.DeletePromotionAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("promotions/{id:int}/hard")]
    public async Task<IActionResult> HardDeletePromotion(int id, CancellationToken cancellationToken)
    {
        await service.PermanentlyDeletePromotionAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPatch("promotions/{id:int}/status")]
    public Task<PromotionItem> SetPromotionStatus(int id, EntityStatusRequest request, CancellationToken cancellationToken) =>
        service.SetPromotionStatusAsync(id, request.IsActive, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("service-plans/{id:int}/qr-code")]
    public Task<QrCodeResult> GenerateQr(int id, CancellationToken cancellationToken) =>
        service.GenerateQrAsync(id, configuration["PublicBaseUrl"] ?? "http://localhost:3000", UserId(), ClientIp(), cancellationToken);

    [AllowAnonymous]
    [HttpGet("service-plans/{id:int}/qr-code")]
    public async Task<IActionResult> GetQr(int id, CancellationToken cancellationToken)
    {
        var dataUrl = await service.GetPublicQrCodeAsync(id, configuration["PublicBaseUrl"] ?? "http://localhost:3000", cancellationToken);
        var base64 = dataUrl[(dataUrl.IndexOf(',') + 1)..];
        return File(Convert.FromBase64String(base64), "image/svg+xml");
    }

    [AllowAnonymous]
    [HttpGet("serviceplans/{id:int}/qr")]
    [HttpGet("service-plans/{id:int}/qr")]
    [Produces("image/png")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetQrPng(int id, CancellationToken cancellationToken)
    {
        var png = await service.GetPublicQrPngAsync(id, configuration["PublicBaseUrl"] ?? "http://localhost:3000", cancellationToken);
        Response.Headers.CacheControl = "public,max-age=300";
        return File(png, "image/png", $"cloudservice-plan-{id}.png");
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string? ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
