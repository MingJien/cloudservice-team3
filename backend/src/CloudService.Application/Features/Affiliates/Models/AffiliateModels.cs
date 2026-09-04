using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates.Models;

public sealed class CreateAffiliateApplicationRequest
{
    [Required, StringLength(150)] public string FullName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(255)] public string Email { get; init; } = string.Empty;
    [Required, RegularExpression("^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0."), StringLength(10)] public string Phone { get; init; } = string.Empty;
    [Url, RegularExpression("^https://.+", ErrorMessage = "Website hoặc kênh giới thiệu phải dùng HTTPS."), StringLength(500)] public string? WebsiteOrChannel { get; init; }
    [StringLength(2000)] public string? Note { get; init; }
}

public sealed record AffiliateDuplicateFields(bool EmailExists, bool PhoneExists, bool WebsiteExists)
{
    public bool Any => EmailExists || PhoneExists || WebsiteExists;
}

public sealed record AffiliateApplicationItem(
    long Id,
    string TrackingCode,
    string FullName,
    string Email,
    string Phone,
    string? WebsiteOrChannel,
    string? Note,
    string? InternalNote,
    AffiliateApplicationStatus Status,
    string? AffiliateCode,
    decimal? CommissionRate,
    bool? PartnerIsActive,
    int ClickCount,
    int ConversionCount,
    decimal PendingCommission,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string RowVersion);

public sealed record ProvisionedAffiliateAccount(string UserName, string TemporaryPassword, bool MustChangePassword, string EmailDeliveryStatus);
public sealed record AffiliateStatusUpdateResult(AffiliateApplicationItem Item, ProvisionedAffiliateAccount? ProvisionedAccount);

// Public responses deliberately omit contact details, internal review notes and
// attribution totals. The opaque code is the only credential needed to follow a
// submitted application from another device.
public sealed record AffiliateApplicationSubmissionReceipt(
    string TrackingCode,
    AffiliateApplicationStatus Status,
    DateTime CreatedAt);

public sealed record AffiliateApplicationTrackingItem(
    string TrackingCode,
    AffiliateApplicationStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? AffiliateCode);

public sealed record AffiliateListQuery(int PageNumber = 1, int PageSize = 20, AffiliateApplicationStatus? Status = null, string? Search = null);
public sealed class UpdateAffiliateStatusRequest
{
    [Required] public AffiliateApplicationStatus Status { get; init; }
    [StringLength(2000)] public string? InternalNote { get; init; }
    [RegularExpression("^[A-Za-z0-9_-]{3,50}$", ErrorMessage = "Mã affiliate chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới và dài 3-50 ký tự.")]
    public string? AffiliateCode { get; init; }
}

public sealed class UpdateAffiliateApplicationRequest
{
    [Required, StringLength(150)] public string FullName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(255)] public string Email { get; init; } = string.Empty;
    [Required, RegularExpression("^0[0-9]{9}$", ErrorMessage = "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0."), StringLength(10)] public string Phone { get; init; } = string.Empty;
    [Url, RegularExpression("^https://.+", ErrorMessage = "Website hoặc kênh giới thiệu phải dùng HTTPS."), StringLength(500)] public string? WebsiteOrChannel { get; init; }
    [StringLength(2000)] public string? Note { get; init; }
    public bool? PartnerIsActive { get; init; }
    [Required, StringLength(64)] public string RowVersion { get; init; } = string.Empty;
}

public sealed class DeleteAffiliateApplicationRequest
{
    [Required, StringLength(64)] public string RowVersion { get; init; } = string.Empty;
}

public sealed class TrackAffiliateReferralRequest
{
    [Required, RegularExpression("^[A-Za-z0-9_-]{3,50}$")] public string AffiliateCode { get; init; } = string.Empty;
    [Required] public Guid VisitId { get; init; }
    [StringLength(500)] public string? LandingPath { get; init; }
    [StringLength(500)] public string? Referrer { get; init; }
}

public sealed record ReferralTrackedResponse(bool Accepted, DateTime? ExpiresAtUtc, string? Proof = null);
