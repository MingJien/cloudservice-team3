using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class AffiliatePayout : LongAuditableEntity
{
    private AffiliatePayout() { }

    public AffiliatePayout(
        AffiliatePartner affiliatePartner,
        string requestCode,
        decimal amount,
        string bankName,
        string bankAccountNumber,
        string bankAccountName,
        DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(affiliatePartner);
        if (affiliatePartner.Id <= 0) throw new ArgumentOutOfRangeException(nameof(affiliatePartner));
        if (amount < 500_000m) throw new ArgumentOutOfRangeException(nameof(amount), "Số tiền rút tối thiểu là 500.000đ.");
        AffiliatePartner = affiliatePartner;
        AffiliatePartnerId = affiliatePartner.Id;
        RequestCode = Guard.Required(requestCode, nameof(requestCode)).Trim().ToUpperInvariant();
        Amount = decimal.Round(amount, 0, MidpointRounding.AwayFromZero);
        BankName = Guard.Required(bankName, nameof(bankName)).Trim();
        BankAccountNumber = NormalizeAccountNumber(bankAccountNumber);
        BankAccountName = Guard.Required(bankAccountName, nameof(bankAccountName)).Trim().ToUpperInvariant();
        RequestedAtUtc = utcNow;
    }

    public long AffiliatePartnerId { get; private set; }
    public string RequestCode { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string BankName { get; private set; } = string.Empty;
    public string BankAccountNumber { get; private set; } = string.Empty;
    public string BankAccountName { get; private set; } = string.Empty;
    public AffiliatePayoutStatus Status { get; private set; } = AffiliatePayoutStatus.Requested;
    public DateTime RequestedAtUtc { get; private set; }
    public DateTime? ReviewedAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }
    public int? ReviewedByUserId { get; private set; }
    public string? ReviewNote { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public AffiliatePartner AffiliatePartner { get; private set; } = null!;
    public ICollection<AffiliateAttribution> Attributions { get; private set; } = new List<AffiliateAttribution>();

    public void StartProcessing(int reviewerId, string? note, DateTime utcNow)
    {
        if (Status != AffiliatePayoutStatus.Requested) throw new InvalidOperationException("Chỉ yêu cầu mới được chuyển sang đối soát.");
        ApplyReview(AffiliatePayoutStatus.Processing, reviewerId, note, utcNow);
    }

    public void MarkPaid(int reviewerId, string? note, DateTime utcNow)
    {
        if (Status is not (AffiliatePayoutStatus.Requested or AffiliatePayoutStatus.Processing))
            throw new InvalidOperationException("Yêu cầu này không còn ở trạng thái có thể thanh toán.");
        ApplyReview(AffiliatePayoutStatus.Paid, reviewerId, note, utcNow);
        PaidAtUtc = utcNow;
        foreach (var attribution in Attributions) attribution.MarkPaid(utcNow);
    }

    public void Reject(int reviewerId, string note, DateTime utcNow)
    {
        if (Status is not (AffiliatePayoutStatus.Requested or AffiliatePayoutStatus.Processing))
            throw new InvalidOperationException("Yêu cầu này không còn ở trạng thái có thể từ chối.");
        if (string.IsNullOrWhiteSpace(note)) throw new ArgumentException("Phải ghi lý do từ chối.", nameof(note));
        ApplyReview(AffiliatePayoutStatus.Rejected, reviewerId, note, utcNow);
        foreach (var attribution in Attributions) attribution.ReleaseFromPayout(utcNow);
    }

    private void ApplyReview(AffiliatePayoutStatus status, int reviewerId, string? note, DateTime utcNow)
    {
        if (reviewerId <= 0) throw new ArgumentOutOfRangeException(nameof(reviewerId));
        Status = status;
        ReviewedByUserId = reviewerId;
        ReviewedAtUtc = utcNow;
        ReviewNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        MarkUpdated(utcNow);
    }

    private static string NormalizeAccountNumber(string value)
    {
        var normalized = new string(Guard.Required(value, nameof(value)).Where(char.IsAsciiLetterOrDigit).ToArray()).ToUpperInvariant();
        if (normalized.Length is < 6 or > 32) throw new ArgumentException("Số tài khoản phải gồm 6-32 chữ hoặc số.", nameof(value));
        return normalized;
    }
}
