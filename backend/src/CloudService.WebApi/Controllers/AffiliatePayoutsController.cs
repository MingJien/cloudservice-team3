using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/affiliate-payouts")]
[Authorize(Roles = RoleNames.Admin)]
public sealed class AffiliatePayoutsController(IAffiliatePortalService service) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<AffiliatePayoutItem>> Get([FromQuery] AffiliatePayoutListQuery query, CancellationToken cancellationToken) =>
        service.GetPayoutsAsync(query, cancellationToken);

    [HttpPatch("{id:long}/status")]
    public Task<AffiliatePayoutItem> Review(long id, ReviewAffiliatePayoutRequest request, CancellationToken cancellationToken) =>
        service.ReviewPayoutAsync(id, request, UserId(), HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
}
