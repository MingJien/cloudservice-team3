using System.ComponentModel.DataAnnotations;
using CloudService.Application.Features.Orders.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Enums;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed class CreateOrderCommand : IRequest<Result<OrderCreatedResponse>>
{
    [Required] public string IdempotencyKey { get; init; } = string.Empty;
    
    [Range(1, int.MaxValue)] public int ServicePlanId { get; init; }
    [Required] public BillingCycle BillingCycle { get; init; }
    [StringLength(50)] public string? PromotionCode { get; init; }
    [Required, StringLength(150)] public string CustomerName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(255)] public string Email { get; init; } = string.Empty;
    [Required, Phone, StringLength(20)] public string Phone { get; init; } = string.Empty;
    [StringLength(200)] public string? CompanyName { get; init; }
    [StringLength(2000)] public string? Note { get; init; }
    [RegularExpression("^[A-Za-z0-9_-]{3,50}$")] public string? AffiliateCode { get; init; }
    public Guid? AffiliateVisitId { get; init; }
}
