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
    public long? AffiliatePayoutId { get; private set; }
    public AffiliatePartner AffiliatePartner { get; private set; } = null!;
    public OrderRequest OrderRequest { get; private set; } = null!;
    public AffiliatePayout? AffiliatePayout { get; private set; }

    public void ScheduleHold(DateTime availableAtUtc, DateTime utcNow)
    {
        if (Status != AffiliateCommissionStatus.Pending) return;
        if (availableAtUtc <= utcNow) throw new ArgumentOutOfRangeException(nameof(availableAtUtc));
        EligibleAtUtc = availableAtUtc;
        MarkUpdated(utcNow);
    }

    public void Mature(DateTime utcNow)
    {
        if (Status != AffiliateCommissionStatus.Pending || EligibleAtUtc is null || EligibleAtUtc > utcNow) return;
        Status = AffiliateCommissionStatus.Eligible;
        MarkUpdated(utcNow);
    }

    public void ReserveForPayout(AffiliatePayout payout, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(payout);
        if (Status != AffiliateCommissionStatus.Eligible || AffiliatePayoutId is not null)
            throw new InvalidOperationException("Chỉ hoa hồng khả dụng chưa đối soát mới được đưa vào lệnh rút.");
        AffiliatePayout = payout;
        if (!payout.Attributions.Contains(this)) payout.Attributions.Add(this);
        MarkUpdated(utcNow);
    }

    public void ReleaseFromPayout(DateTime utcNow)
    {
        if (Status != AffiliateCommissionStatus.Eligible) return;
        AffiliatePayout = null;
        AffiliatePayoutId = null;
        MarkUpdated(utcNow);
    }

    public void MarkPaid(DateTime utcNow)
    {
        if (Status != AffiliateCommissionStatus.Eligible || AffiliatePayout is null)
            throw new InvalidOperationException("Hoa hồng chưa được đối soát trong một yêu cầu rút tiền.");
        Status = AffiliateCommissionStatus.Paid;
        PaidAtUtc = utcNow;
        MarkUpdated(utcNow);
    }

    public void Reject(DateTime utcNow)
    {
        if (Status == AffiliateCommissionStatus.Paid) throw new InvalidOperationException("Không thể từ chối hoa hồng đã thanh toán.");
        Status = AffiliateCommissionStatus.Rejected;
        MarkUpdated(utcNow);
    }

    public void SetImportedCreatedAt(DateTime createdAtUtc)
    {
        if (createdAtUtc.Kind != DateTimeKind.Utc || createdAtUtc > DateTime.UtcNow)
            throw new ArgumentOutOfRangeException(nameof(createdAtUtc));

        CreatedAt = createdAtUtc;
    }
}
