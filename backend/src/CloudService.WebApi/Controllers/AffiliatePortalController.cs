using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/affiliate-portal")]
[Authorize(Roles = RoleNames.Affiliate)]
public sealed class AffiliatePortalController(IAffiliatePortalService service) : ControllerBase
{
    [HttpGet("dashboard")]
    public Task<AffiliatePortalDashboard> Dashboard(CancellationToken cancellationToken) =>
        service.GetDashboardAsync(UserId(), cancellationToken);

    [HttpGet("orders")]
    public Task<PagedResult<AffiliatePortalOrderItem>> Orders([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default) =>
        service.GetOrdersAsync(UserId(), pageNumber, pageSize, cancellationToken);

    [HttpGet("payouts")]
    public Task<PagedResult<AffiliatePayoutItem>> Payouts([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default) =>
        service.GetMyPayoutsAsync(UserId(), pageNumber, pageSize, cancellationToken);

    [HttpPost("payouts")]
    [ProducesResponseType<AffiliatePayoutItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<AffiliatePayoutItem>> RequestPayout(CreateAffiliatePayoutRequest request, CancellationToken cancellationToken)
    {
        var result = await service.RequestPayoutAsync(UserId(), request, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
}
