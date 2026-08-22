using CloudService.Domain.Common;

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
    public byte[] RowVersion { get; private set; } = [];
    public AffiliateApplication Application { get; private set; } = null!;
    public ICollection<AffiliateReferral> Referrals { get; private set; } = new List<AffiliateReferral>();
    public ICollection<AffiliateAttribution> Attributions { get; private set; } = new List<AffiliateAttribution>();

    public void Update(string displayName, decimal commissionRate, bool isActive, DateTime utcNow)
    {
        DisplayName = Guard.Required(displayName, nameof(displayName)).Trim();
        SetCommissionRate(commissionRate);
        IsActive = isActive;
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
