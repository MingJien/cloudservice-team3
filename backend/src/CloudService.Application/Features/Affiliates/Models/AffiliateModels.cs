using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates.Models;

public sealed class CreateAffiliateApplicationRequest
{
    [Required, StringLength(150)] public string FullName { get; init; } = string.Empty;
    [Required, EmailAddress, StringLength(255)] public string Email { get; init; } = string.Empty;
    [Required, Phone, StringLength(20)] public string Phone { get; init; } = string.Empty;
    [Url, StringLength(500)] public string? WebsiteOrChannel { get; init; }
    [StringLength(2000)] public string? Note { get; init; }
}

public sealed record AffiliateApplicationItem(
    long Id,
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
    DateTime? UpdatedAt);
public sealed record AffiliateListQuery(int PageNumber = 1, int PageSize = 20, AffiliateApplicationStatus? Status = null, string? Search = null);
public sealed class UpdateAffiliateStatusRequest
{
    [Required] public AffiliateApplicationStatus Status { get; init; }
    [StringLength(2000)] public string? InternalNote { get; init; }
    [RegularExpression("^[A-Za-z0-9_-]{3,50}$", ErrorMessage = "Mã affiliate chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới và dài 3-50 ký tự.")]
    public string? AffiliateCode { get; init; }
    [Range(typeof(decimal), "0", "100", ErrorMessage = "Tỷ lệ hoa hồng phải nằm trong khoảng 0-100%.")]
    public decimal? CommissionRate { get; init; }
}

public sealed class TrackAffiliateReferralRequest
{
    [Required, RegularExpression("^[A-Za-z0-9_-]{3,50}$")] public string AffiliateCode { get; init; } = string.Empty;
    [Required] public Guid VisitId { get; init; }
    [StringLength(500)] public string? LandingPath { get; init; }
    [StringLength(500)] public string? Referrer { get; init; }
}

public sealed record ReferralTrackedResponse(bool Accepted, DateTime? ExpiresAtUtc);
