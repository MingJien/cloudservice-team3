using CloudService.Application.Features.Dashboard.Interfaces;
using CloudService.Application.Features.Dashboard.Models;
using CloudService.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Authorize(Roles = RoleNames.Admin)]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService service) : ControllerBase
{
    [HttpGet("summary")]
    public Task<DashboardResponse> Summary([FromQuery] int months = 6, CancellationToken cancellationToken = default) => service.GetAsync(months, cancellationToken);

    [HttpGet]
    public Task<DashboardResponse> Get([FromQuery] int months = 6, CancellationToken cancellationToken = default) => service.GetAsync(months, cancellationToken);
}
