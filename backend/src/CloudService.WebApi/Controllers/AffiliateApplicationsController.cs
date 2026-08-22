using System.Security.Claims;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/affiliate-applications")]
public sealed class AffiliateApplicationsController(IAffiliateService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType<AffiliateApplicationItem>(StatusCodes.Status201Created)]
    public async Task<ActionResult<AffiliateApplicationItem>> Create(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken)
    {
        var item = await service.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, item);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet]
    public Task<PagedResult<AffiliateApplicationItem>> Get([FromQuery] AffiliateListQuery query, CancellationToken cancellationToken) => service.GetAsync(query, cancellationToken);

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType<AffiliateApplicationItem>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AffiliateApplicationItem>> UpdateStatus(long id, UpdateAffiliateStatusRequest request, CancellationToken cancellationToken)
    {
        var item = await service.UpdateStatusAsync(id, request, UserId(), HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(item);
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
}
