using CloudService.Application.Common.Exceptions;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/service-plans")]
public sealed class ServicePlanComparisonController(IPlanComparisonService comparisonService) : ControllerBase
{
    [HttpGet("compare")]
    [ProducesResponseType<PlanComparisonResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlanComparisonResponse>> Compare(
        [FromQuery] string ids,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(ids))
        {
            throw new RequestValidationException(nameof(ids), "Cần cung cấp danh sách mã gói, ví dụ ids=1,2,3.");
        }

        var parts = ids.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Any(part => !int.TryParse(part, out _)))
        {
            throw new RequestValidationException(nameof(ids), "Danh sách mã gói phải là các số nguyên phân tách bằng dấu phẩy.");
        }

        var parsedIds = parts.Select(int.Parse).ToArray();
        return Ok(await comparisonService.CompareAsync(parsedIds, cancellationToken));
    }
}
