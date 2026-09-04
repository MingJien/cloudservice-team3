using System.ComponentModel.DataAnnotations;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates.Models;

public sealed record AffiliatePortalDashboard(
    string PartnerCode,
    string DisplayName,
    AffiliateTier Tier,
    decimal CommissionRate,
    int ClickCount,
    int ConversionCount,
    decimal ConversionRate,
    decimal PendingBalance,
    decimal AvailableBalance,
    decimal PaidBalance,
    DateTime? TierEvaluatedAtUtc,
    int OrdersUntilNextTier,
    string? NextTier,
    IReadOnlyList<AffiliateWeeklyPerformance> WeeklyPerformance);

public sealed record AffiliateWeeklyPerformance(
    DateTime WeekStartUtc,
    int CompletedOrders,
    decimal CommissionAmount);

public sealed record AffiliatePortalOrderItem(
    long Id,
    string TrackingCode,
    string MaskedCustomerName,
    string PlanName,
    decimal Revenue,
    decimal CommissionAmount,
    decimal CommissionRate,
    AffiliateCommissionStatus CommissionStatus,
    DateTime? AvailableAtUtc,
    DateTime CreatedAt);

public sealed record AffiliatePayoutItem(
    long Id,
    string RequestCode,
    string PartnerCode,
    string PartnerName,
    decimal Amount,
    string BankName,
    string MaskedBankAccount,
    string? BankAccountNumber,
    string BankAccountName,
    AffiliatePayoutStatus Status,
    DateTime RequestedAtUtc,
    DateTime? PaidAtUtc,
    string? ReviewNote,
    string RowVersion);

public sealed class CreateAffiliatePayoutRequest
{
    [Required, StringLength(100)] public string BankName { get; init; } = string.Empty;
    [Required, RegularExpression("^[A-Za-z0-9]{6,32}$", ErrorMessage = "Số tài khoản phải gồm 6-32 chữ hoặc số.")] public string BankAccountNumber { get; init; } = string.Empty;
    [Required, StringLength(150)] public string BankAccountName { get; init; } = string.Empty;
}

public sealed record AffiliatePayoutListQuery(int PageNumber = 1, int PageSize = 20, AffiliatePayoutStatus? Status = null, string? Search = null);

public sealed class ReviewAffiliatePayoutRequest
{
    [Required] public AffiliatePayoutStatus Status { get; init; }
    [StringLength(1000)] public string? ReviewNote { get; init; }
    [Required, StringLength(64)] public string RowVersion { get; init; } = string.Empty;
}
