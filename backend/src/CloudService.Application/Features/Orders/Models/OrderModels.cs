using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Orders.Models;

public sealed class CreateOrderRequest
{
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

public sealed record OrderCreatedResponse(
    string TrackingCode,
    string PlanName,
    BillingCycle BillingCycle,
    decimal EstimatedAmount,
    string Currency,
    OrderRequestStatus Status,
    DateTime CreatedAt,
    string? AffiliateCode = null);

public sealed record OrderTrackingResponse(
    string TrackingCode,
    string PlanName,
    BillingCycle BillingCycle,
    decimal EstimatedAmount,
    string Currency,
    OrderRequestStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record OrderAdminItem(
    long Id,
    string TrackingCode,
    string CustomerName,
    string Email,
    string Phone,
    string? CompanyName,
    int ServicePlanId,
    string PlanName,
    BillingCycle BillingCycle,
    string? PromotionCode,
    decimal UnitPrice,
    decimal DiscountAmount,
    decimal EstimatedAmount,
    string Currency,
    string? Note,
    string? InternalNote,
    string? AffiliateCode,
    decimal? AffiliateCommissionAmount,
    OrderRequestStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string RowVersion);

public sealed record OrderListQuery(int PageNumber = 1, int PageSize = 20, OrderRequestStatus? Status = null, string? Search = null);

public sealed class UpdateOrderStatusRequest
{
    [Required] public OrderRequestStatus Status { get; init; }
    [StringLength(2000)] public string? InternalNote { get; init; }
    [Required, StringLength(64)] public string RowVersion { get; init; } = string.Empty;
}

public sealed record OrderExportResult(byte[] Content, string FileName, string ContentType);
