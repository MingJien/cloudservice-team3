using System.Security.Claims;
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
    public async Task<IActionResult> Create(
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey, 
        [FromBody] CreateOrderRequest request, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return BadRequest(new { code = "Order.MissingIdempotencyKey", message = "Yêu cầu phải cung cấp Idempotency-Key trên Header." });
            
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
            AffiliateCode = request.AffiliateCode,
            AffiliateVisitId = request.AffiliateVisitId
        };
        
        var result = await mediator.Send(command, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { code = result.Error.Code, message = result.Error.Message });
            
        return CreatedAtAction(nameof(Track), new { trackingCode = result.Value.TrackingCode }, result.Value);
    }

    [AllowAnonymous]
    [HttpGet("track/{trackingCode}")]
    [ProducesResponseType<OrderTrackingResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Track(string trackingCode, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new TrackOrderQuery(trackingCode), cancellationToken);
        if (result.IsFailure)
            return NotFound(new { code = result.Error.Code, message = result.Error.Message });
            
        return Ok(result.Value);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpGet]
    [ProducesResponseType<PagedResult<OrderAdminItem>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] OrderListQuery query, CancellationToken cancellationToken)
    {
        var request = new GetOrderListQuery(query.PageNumber, query.PageSize, query.Status, query.Search);
        var result = await mediator.Send(request, cancellationToken);
        
        if (result.IsFailure)
            return BadRequest(new { code = result.Error.Code, message = result.Error.Message });
            
        return Ok(result.Value);
    }

    [Authorize(Roles = RoleNames.AdminOrEditor)]
    [HttpPatch("{id:long}/status")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
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
            return BadRequest(new { code = result.Error.Code, message = result.Error.Message });
            
        return NoContent();
    }

    [Authorize(Roles = RoleNames.Admin)]
    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] OrderListQuery query, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ExportOrdersQuery(query.Status, query.Search), cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { code = result.Error.Code, message = result.Error.Message });
            
        return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
    }

    private int UserId() => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
    private string? ClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
