using System.Security.Claims;
using CloudService.Domain.Common;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Orders.Commands;
using CloudService.Application.Features.Orders.Models;
using CloudService.Application.Features.Orders.Queries;
using CloudService.Domain.Constants;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudService.WebApi.Controllers;

[ApiController]
[Route("api/order-requests")]
public sealed class OrderRequestsController(IMediator mediator) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    [EnableRateLimiting("order-create")]
    [ProducesResponseType<OrderCreatedResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey, 
        [FromBody] CreateOrderRequest request, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return ProblemFor(new Error("Order.MissingIdempotencyKey", "Yêu cầu phải cung cấp Idempotency-Key trên Header."));
            
        var command = new CreateOrderCommand
        {
            IdempotencyKey = idempotencyKey,
            ServicePlanId = request.ServicePlanId,
            BillingCycle = request.BillingCycle,
            PromotionCode = request.PromotionCode,
            CustomerName = request.CustomerName,
            Email = request.Email,
            Phone = request.Phone,
            CompanyName = request.CompanyName,
            Note = request.Note,
            QuoteToken = request.QuoteToken,
            AffiliateCode = request.AffiliateCode,
            AffiliateVisitId = request.AffiliateVisitId,
            AffiliateProof = request.AffiliateProof
        };
        
        var result = await mediator.Send(command, cancellationToken);
        if (result.IsFailure)
            return ProblemFor(result.Error);
            
        return CreatedAtAction(nameof(Track), new { trackingCode = result.Value.TrackingCode }, result.Value);
    }

    [AllowAnonymous]
    [HttpGet("track/{trackingCode}")]
    [ProducesResponseType<OrderTrackingResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Track(string trackingCode, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new TrackOrderQuery(trackingCode), cancellationToken);
        if (result.IsFailure)
            return ProblemFor(result.Error);
            
        return Ok(result.Value);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet]
    [ProducesResponseType<PagedResult<OrderAdminItem>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Get([FromQuery] OrderListQuery query, CancellationToken cancellationToken)
    {
        var request = new GetOrderListQuery(query.PageNumber, query.PageSize, query.Status, query.Search);
        var result = await mediator.Send(request, cancellationToken);
        
        if (result.IsFailure)
            return ProblemFor(result.Error);
            
        return Ok(result.Value);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateStatus(long id, UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateOrderStatusCommand
        {
            Id = id,
            Status = request.Status,
            InternalNote = request.InternalNote,
            RowVersion = request.RowVersion,
            UserId = UserId(),
            IpAddress = ClientIp()
        };
        
        var result = await mediator.Send(command, cancellationToken);
        if (result.IsFailure)
            return ProblemFor(result.Error);
            
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpPost("export")]
    [ProducesResponseType<OrderExportJobResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartExport([FromQuery] OrderListQuery query, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(
            new StartOrderExportCommand(UserId(), query.Status, query.Search),
            cancellationToken);
        if (result.IsFailure)
            return ProblemFor(result.Error);

        return AcceptedAtAction(
            nameof(GetExportJob),
            new { jobId = result.Value.JobId },
            result.Value);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("export/{jobId:guid}")]
    [ProducesResponseType<OrderExportJobResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExportJob(Guid jobId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetOrderExportJobQuery(jobId, UserId()), cancellationToken);
        return result.IsFailure ? ProblemFor(result.Error) : Ok(result.Value);
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("export/{jobId:guid}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DownloadExport(Guid jobId, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new DownloadOrderExportQuery(jobId, UserId()), cancellationToken);
        if (result.IsFailure) return ProblemFor(result.Error);
        return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string? ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private ObjectResult ProblemFor(Error error)
    {
        var status = error.Code.EndsWith("NotFound", StringComparison.OrdinalIgnoreCase)
            ? StatusCodes.Status404NotFound
            : error.Code.Contains("Conflict", StringComparison.OrdinalIgnoreCase)
                || error.Code.Contains("NotReady", StringComparison.OrdinalIgnoreCase)
                || error.Code.Contains("Stale", StringComparison.OrdinalIgnoreCase)
                ? StatusCodes.Status409Conflict
                : StatusCodes.Status400BadRequest;
        var problem = new ProblemDetails
        {
            Status = status,
            Title = status == StatusCodes.Status409Conflict ? "Yêu cầu xung đột với dữ liệu hiện tại." : "Dữ liệu yêu cầu không hợp lệ.",
            Detail = error.Message,
            Instance = HttpContext.Request.Path
        };
        problem.Extensions["code"] = error.Code;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        return StatusCode(status, problem);
    }
}
