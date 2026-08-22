using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/pricing")]
public sealed class PricingController(IPricingService pricingService) : ControllerBase
{
    [HttpPost("quotes")]
    [ProducesResponseType<PricingQuoteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PricingQuoteResponse>> Quote(
        PricingQuoteRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await pricingService.QuoteAsync(request, cancellationToken));
    }
}
