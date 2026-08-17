using CloudService.Application.Common.Models;
using CloudService.Application.Features.AuditLogs.Interfaces;
using CloudService.Application.Features.AuditLogs.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/audit-logs")]
public sealed class AuditLogsController(IAuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AuditLogItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResult<AuditLogItem>>> Get(
        [FromQuery] PagedRequest paging,
        [FromQuery] string? action,
        [FromQuery] int? userId,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        CancellationToken cancellationToken)
    {
        var filter = new AuditLogFilter(action, userId, fromUtc, toUtc);
        return Ok(await auditLogService.GetAsync(paging, filter, cancellationToken));
    }
}
