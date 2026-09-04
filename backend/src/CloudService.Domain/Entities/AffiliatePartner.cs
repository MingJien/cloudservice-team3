using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class AffiliatePartner : LongAuditableEntity
{
    private AffiliatePartner()
    {
    }

    public AffiliatePartner(long applicationId, string code, string displayName, decimal commissionRate)
    {
        if (applicationId <= 0) throw new ArgumentOutOfRangeException(nameof(applicationId));
        ApplicationId = applicationId;
        Code = NormalizeCode(code);
        DisplayName = Guard.Required(displayName, nameof(displayName)).Trim();
        SetCommissionRate(commissionRate);
    }

    public long ApplicationId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string DisplayName { get; private set; } = string.Empty;
    public decimal CommissionRate { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int? AppUserId { get; private set; }
    public AffiliateTier Tier { get; private set; } = AffiliateTier.Newbie;
    public DateTime? TierEvaluatedAtUtc { get; private set; }
    public int ImportedClickCount { get; private set; }
    public int ImportedConversionCount { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public AffiliateApplication Application { get; private set; } = null!;
    public AppUser? AppUser { get; private set; }
    public ICollection<AffiliateReferral> Referrals { get; private set; } = new List<AffiliateReferral>();
    public ICollection<AffiliateAttribution> Attributions { get; private set; } = new List<AffiliateAttribution>();
    public ICollection<AffiliatePayout> Payouts { get; private set; } = new List<AffiliatePayout>();

    public void LinkAccount(int appUserId)
    {
        if (appUserId <= 0) throw new ArgumentOutOfRangeException(nameof(appUserId));
        if (AppUserId is not null && AppUserId != appUserId) throw new InvalidOperationException("Đối tác đã liên kết với tài khoản khác.");
        AppUserId = appUserId;
    }

    public void EvaluateTier(int completedOrdersInMonth, DateTime utcNow)
    {
        if (completedOrdersInMonth < 0) throw new ArgumentOutOfRangeException(nameof(completedOrdersInMonth));
        Tier = completedOrdersInMonth switch
        {
            >= 50 => AffiliateTier.Gold,
            >= 20 => AffiliateTier.Silver,
            >= 5 => AffiliateTier.Bronze,
            _ => AffiliateTier.Newbie
        };
        SetCommissionRate(Tier switch
        {
            AffiliateTier.Gold => 12m,
            AffiliateTier.Silver => 9m,
            AffiliateTier.Bronze => 7m,
            _ => 5m
        });
        TierEvaluatedAtUtc = utcNow;
        MarkUpdated(utcNow);
    }

    public void ImportHistoricalCounters(int clicks, int conversions)
    {
        if (clicks < 0 || conversions < 0 || conversions > clicks) throw new ArgumentOutOfRangeException(nameof(clicks));
        ImportedClickCount = clicks;
        ImportedConversionCount = conversions;
    }

    public void Update(string displayName, decimal commissionRate, bool isActive, DateTime utcNow)
    {
        DisplayName = Guard.Required(displayName, nameof(displayName)).Trim();
        SetCommissionRate(commissionRate);
        IsActive = isActive;
        MarkUpdated(utcNow);
    }

    public void ChangeCode(string code, DateTime utcNow)
    {
        var normalized = NormalizeCode(code);
        if (Code == normalized) return;
        Code = normalized;
        MarkUpdated(utcNow);
    }

    public void Deactivate(DateTime utcNow)
    {
        // Attribution and payout records are financial evidence. A retired demo
        // partner is therefore disabled rather than deleted so that evidence
        // remains referentially intact and cannot be used for new referrals.
        if (!IsActive) return;
        IsActive = false;
        MarkUpdated(utcNow);
    }

    private void SetCommissionRate(decimal value)
    {
        if (value is < 0 or > 100) throw new ArgumentOutOfRangeException(nameof(value));
        CommissionRate = decimal.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public static string NormalizeCode(string value)
    {
        var normalized = Guard.Required(value, nameof(value)).Trim().ToUpperInvariant();
        if (normalized.Length is < 3 or > 50 || normalized.Any(character => !char.IsAsciiLetterOrDigit(character) && character is not '-' and not '_'))
            throw new ArgumentException("Mã affiliate chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới và dài 3-50 ký tự.", nameof(value));
        return normalized;
    }
}
