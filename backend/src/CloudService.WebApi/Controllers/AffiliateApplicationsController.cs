using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/affiliate-applications")]
public sealed class AffiliateApplicationsController(IAffiliateService service) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("affiliate-application")]
    [HttpPost]
    [ProducesResponseType<AffiliateApplicationSubmissionReceipt>(StatusCodes.Status201Created)]
    public async Task<ActionResult<AffiliateApplicationSubmissionReceipt>> Create(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [AllowAnonymous]
    [EnableRateLimiting("affiliate-tracking")]
    [HttpGet("tracking/{trackingCode}")]
    [ProducesResponseType<AffiliateApplicationTrackingItem>(StatusCodes.Status200OK)]
    public Task<AffiliateApplicationTrackingItem> GetPublicStatus(string trackingCode, CancellationToken cancellationToken) =>
        service.GetPublicStatusAsync(trackingCode, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet]
    public Task<PagedResult<AffiliateApplicationItem>> Get([FromQuery] AffiliateListQuery query, CancellationToken cancellationToken) => service.GetAsync(query, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType<AffiliateStatusUpdateResult>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AffiliateStatusUpdateResult>> UpdateStatus(long id, UpdateAffiliateStatusRequest request, CancellationToken cancellationToken)
    {
        var item = await service.UpdateStatusAsync(id, request, UserId(), HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(item);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPut("{id:long}")]
    [ProducesResponseType<AffiliateApplicationItem>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AffiliateApplicationItem>> Update(long id, UpdateAffiliateApplicationRequest request, CancellationToken cancellationToken)
    {
        var item = await service.UpdateAsync(id, request, UserId(), HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(item);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        long id,
        [FromHeader(Name = "If-Match")] string? ifMatch,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ifMatch))
            return StatusCode(StatusCodes.Status428PreconditionRequired, new ProblemDetails
            {
                Status = StatusCodes.Status428PreconditionRequired,
                Title = "Thiếu phiên bản dữ liệu.",
                Detail = "Hãy tải lại danh sách trước khi xóa hồ sơ Affiliate."
            });

        var rowVersion = ifMatch.Trim();
        if (rowVersion.StartsWith("W/", StringComparison.OrdinalIgnoreCase)) rowVersion = rowVersion[2..].Trim();
        rowVersion = rowVersion.Trim('"');
        var request = new DeleteAffiliateApplicationRequest { RowVersion = rowVersion };
        await service.DeleteAsync(id, request, UserId(), HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return NoContent();
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
}
