using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Orders.Events;

public sealed record OrderCreatedV1(
    Guid EventId,
    string TrackingCode,
    string PlanName,
    decimal EstimatedAmount,
    string Currency,
    OrderRequestStatus Status,
    string? AffiliateCode,
    DateTime OccurredOnUtc);

// V2 intentionally carries an operations-friendly snapshot. The outbox payload stays
// immutable even if catalog/customer records are changed after checkout.
public sealed record OrderCreatedV2(
    Guid EventId,
    string TrackingCode,
    string PlanName,
    BillingCycle BillingCycle,
    decimal EstimatedAmount,
    string Currency,
    OrderRequestStatus Status,
    string CustomerName,
    string Email,
    string Phone,
    string? CompanyName,
    string? PromotionCode,
    string? AffiliateCode,
    DateTime OccurredOnUtc);

public sealed record OrderStatusChangedV1(
    Guid EventId,
    string TrackingCode,
    OrderRequestStatus PreviousStatus,
    OrderRequestStatus CurrentStatus,
    DateTime OccurredOnUtc);

// V2 is a notification snapshot, not a second read of mutable order/catalog data.
// That keeps retries deterministic and gives the operations channel enough context
// to act without exposing full customer contact details in the QR payload.
public sealed record OrderStatusChangedV2(
    Guid EventId,
    string TrackingCode,
    string PlanName,
    BillingCycle BillingCycle,
    decimal EstimatedAmount,
    string Currency,
    string CustomerName,
    OrderRequestStatus PreviousStatus,
    OrderRequestStatus CurrentStatus,
    string? InternalNote,
    int ActorUserId,
    DateTime OccurredOnUtc);
