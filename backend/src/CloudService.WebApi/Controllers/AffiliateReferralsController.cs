using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudService.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/affiliate-referrals")]
public sealed class AffiliateReferralsController(IAffiliateService service) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting("affiliate-referral")]
    [ProducesResponseType<ReferralTrackedResponse>(StatusCodes.Status202Accepted)]
    public async Task<ActionResult<ReferralTrackedResponse>> Track(
        TrackAffiliateReferralRequest request,
        CancellationToken cancellationToken)
    {
        var result = await service.TrackReferralAsync(request, cancellationToken);
        return Accepted(result);
    }
}
