using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Application.Features.Services.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api")]
public sealed class ServiceCatalogController(IServiceCatalogService service, IConfiguration configuration) : ControllerBase
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
    [HttpPut("service-plans/{id:int}")]
    public Task<ServicePlanItem> UpdatePlan(int id, ServicePlanRequest request, CancellationToken cancellationToken) =>
        service.UpdatePlanAsync(id, request, UserId(), ClientIp(), cancellationToken);

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("service-plans/{id:int}")]
    public async Task<IActionResult> DeletePlan(int id, CancellationToken cancellationToken)
    {
        await service.DeletePlanAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

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

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("plan-prices/{id:int}")]
    public async Task<IActionResult> DeletePrice(int id, CancellationToken cancellationToken)
    {
        await service.DeletePriceAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

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

    [Authorize(Roles = RoleNames.Admin)]
    [HttpDelete("promotions/{id:int}")]
    public async Task<IActionResult> DeletePromotion(int id, CancellationToken cancellationToken)
    {
        await service.DeletePromotionAsync(id, UserId(), ClientIp(), cancellationToken);
        return NoContent();
    }

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

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string? ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
