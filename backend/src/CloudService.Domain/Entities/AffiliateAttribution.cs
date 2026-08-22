using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class AffiliateAttribution : LongAuditableEntity
{
    private AffiliateAttribution()
    {
    }

    public AffiliateAttribution(AffiliatePartner partner, OrderRequest order, string codeSnapshot, decimal commissionRateSnapshot)
    {
        ArgumentNullException.ThrowIfNull(partner);
        ArgumentNullException.ThrowIfNull(order);
        if (commissionRateSnapshot is < 0 or > 100) throw new ArgumentOutOfRangeException(nameof(commissionRateSnapshot));
        AffiliatePartner = partner;
        OrderRequest = order;
        AffiliateCodeSnapshot = AffiliatePartner.NormalizeCode(codeSnapshot);
        CommissionRateSnapshot = decimal.Round(commissionRateSnapshot, 2, MidpointRounding.AwayFromZero);
        RevenueSnapshot = order.EstimatedAmount;
        CommissionAmount = decimal.Round(RevenueSnapshot * CommissionRateSnapshot / 100m, 2, MidpointRounding.AwayFromZero);
    }

    public long AffiliatePartnerId { get; private set; }
    public long OrderRequestId { get; private set; }
    public string AffiliateCodeSnapshot { get; private set; } = string.Empty;
    public decimal CommissionRateSnapshot { get; private set; }
    public decimal RevenueSnapshot { get; private set; }
    public decimal CommissionAmount { get; private set; }
    public AffiliateCommissionStatus Status { get; private set; } = AffiliateCommissionStatus.Pending;
    public DateTime? EligibleAtUtc { get; private set; }
    public DateTime? PaidAtUtc { get; private set; }
    public AffiliatePartner AffiliatePartner { get; private set; } = null!;
    public OrderRequest OrderRequest { get; private set; } = null!;

    public void MarkEligible(DateTime utcNow)
    {
        if (Status != AffiliateCommissionStatus.Pending) return;
        Status = AffiliateCommissionStatus.Eligible;
        EligibleAtUtc = utcNow;
        MarkUpdated(utcNow);
    }

    public void Reject(DateTime utcNow)
    {
        if (Status == AffiliateCommissionStatus.Paid) throw new InvalidOperationException("Không thể từ chối hoa hồng đã thanh toán.");
        Status = AffiliateCommissionStatus.Rejected;
        MarkUpdated(utcNow);
    }
}
