using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/service-plan-recommendations")]
public sealed class ServicePlanRecommendationsController(
    IServicePlanRecommendationService recommendationService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<ServicePlanRecommendationResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServicePlanRecommendationResponse>> Recommend(
        ServicePlanRecommendationRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await recommendationService.RecommendAsync(request, cancellationToken));
    }
}
