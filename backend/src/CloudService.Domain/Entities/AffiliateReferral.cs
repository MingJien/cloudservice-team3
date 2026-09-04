using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class AffiliateReferral : LongAuditableEntity
{
    private AffiliateReferral()
    {
    }

    public AffiliateReferral(long affiliatePartnerId, Guid visitId, DateTime expiresAtUtc, string? landingPath, string? referrer)
    {
        if (affiliatePartnerId <= 0) throw new ArgumentOutOfRangeException(nameof(affiliatePartnerId));
        if (visitId == Guid.Empty) throw new ArgumentException("VisitId không được rỗng.", nameof(visitId));
        if (expiresAtUtc <= DateTime.UtcNow) throw new ArgumentOutOfRangeException(nameof(expiresAtUtc));
        AffiliatePartnerId = affiliatePartnerId;
        VisitId = visitId;
        ExpiresAtUtc = expiresAtUtc;
        LandingPath = NormalizeOptional(landingPath, 500);
        Referrer = NormalizeOptional(referrer, 500);
    }

    public long AffiliatePartnerId { get; private set; }
    public Guid VisitId { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? ConvertedAtUtc { get; private set; }
    public long? OrderRequestId { get; private set; }
    public string? LandingPath { get; private set; }
    public string? Referrer { get; private set; }
    public AffiliatePartner AffiliatePartner { get; private set; } = null!;
    public OrderRequest? OrderRequest { get; private set; }

    public bool IsValidAt(DateTime utcNow) => ConvertedAtUtc is null && ExpiresAtUtc > utcNow;

    public void MarkConverted(OrderRequest order, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(order);
        if (!IsValidAt(utcNow)) throw new InvalidOperationException("Referral đã hết hạn hoặc đã được chuyển đổi.");
        OrderRequest = order;
        ConvertedAtUtc = utcNow;
        MarkUpdated(utcNow);
    }

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}
