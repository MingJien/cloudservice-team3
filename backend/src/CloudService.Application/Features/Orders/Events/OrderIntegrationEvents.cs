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

public sealed record OrderStatusChangedV1(
    Guid EventId,
    string TrackingCode,
    OrderRequestStatus PreviousStatus,
    OrderRequestStatus CurrentStatus,
    DateTime OccurredOnUtc);
