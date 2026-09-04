using System.Security.Cryptography;
using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates;

public sealed class AffiliatePortalService(
    IAffiliateRepository repository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IAffiliatePortalService
{
    private const decimal MinimumPayout = 500_000m;

    public async Task<AffiliatePortalDashboard> GetDashboardAsync(int userId, CancellationToken cancellationToken)
    {
        var partner = await PartnerAsync(userId, cancellationToken);
        await MatureLoadedPartnerAsync(partner, cancellationToken);
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;

        var successfulOrders = partner.ImportedConversionCount + partner.Attributions.Count(item => item.OrderRequest.Status == OrderRequestStatus.Done);
        var clicks = partner.ImportedClickCount + partner.Referrals.Count;
        var next = NextTier(successfulOrders, partner.Tier);
        return new AffiliatePortalDashboard(
            partner.Code,
            partner.DisplayName,
            partner.Tier,
            partner.CommissionRate,
            clicks,
            successfulOrders,
            clicks == 0 ? 0m : decimal.Round(successfulOrders * 100m / clicks, 2, MidpointRounding.AwayFromZero),
            partner.Attributions.Where(item => item.Status == AffiliateCommissionStatus.Pending).Sum(item => item.CommissionAmount),
            partner.Attributions.Where(item => item.Status == AffiliateCommissionStatus.Eligible && item.AffiliatePayoutId is null).Sum(item => item.CommissionAmount),
            partner.Attributions.Where(item => item.Status == AffiliateCommissionStatus.Paid).Sum(item => item.CommissionAmount),
            partner.TierEvaluatedAtUtc,
            next.Orders,
            next.Name,
            BuildWeeklyPerformance(partner, utcNow));
    }

    public async Task<PagedResult<AffiliatePortalOrderItem>> GetOrdersAsync(int userId, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        ValidatePaging(pageNumber, pageSize);
        var partner = await PartnerAsync(userId, cancellationToken);
        await MatureLoadedPartnerAsync(partner, cancellationToken);
        var ordered = partner.Attributions.OrderByDescending(item => item.CreatedAt).ToArray();
        return PagedResult<AffiliatePortalOrderItem>.Create(
            ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(MapOrder),
            pageNumber,
            pageSize,
            ordered.Length);
    }

    public async Task<PagedResult<AffiliatePayoutItem>> GetMyPayoutsAsync(int userId, int pageNumber, int pageSize, CancellationToken cancellationToken)
    {
        ValidatePaging(pageNumber, pageSize);
        var partner = await PartnerAsync(userId, cancellationToken);
        var result = await repository.GetPayoutsAsync(pageNumber, pageSize, null, null, partner.Id, cancellationToken);
        return PagedResult<AffiliatePayoutItem>.Create(result.Items.Select(item => MapPayout(item, includeSensitiveBankData: false)), pageNumber, pageSize, result.TotalCount);
    }

    public async Task<AffiliatePayoutItem> RequestPayoutAsync(int userId, CreateAffiliatePayoutRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var partner = await PartnerAsync(userId, cancellationToken);
        await MatureLoadedPartnerAsync(partner, cancellationToken);
        if (partner.Payouts.Any(item => item.Status is AffiliatePayoutStatus.Requested or AffiliatePayoutStatus.Processing))
            throw new ConflictException("Bạn đang có một yêu cầu rút tiền chờ đối soát. Hãy đợi yêu cầu đó hoàn tất.");

        var available = partner.Attributions
            .Where(item => item.Status == AffiliateCommissionStatus.Eligible && item.AffiliatePayoutId is null)
            .OrderBy(item => item.EligibleAtUtc)
            .ToArray();
        var amount = available.Sum(item => item.CommissionAmount);
        if (amount < MinimumPayout)
            throw new ConflictException($"Số dư khả dụng phải đạt tối thiểu {MinimumPayout:N0}đ mới có thể rút.");

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var payout = new AffiliatePayout(partner, await AllocatePayoutCodeAsync(cancellationToken), amount, request.BankName, request.BankAccountNumber, request.BankAccountName, utcNow);
        repository.Add(payout);
        foreach (var attribution in available) attribution.ReserveForPayout(payout, utcNow);
        unitOfWork.AddAuditLog(new AuditLog(
            "Affiliate.PayoutRequested",
            userId,
            nameof(AffiliatePayout),
            payout.RequestCode,
            newValues: JsonSerializer.Serialize(new { payout.RequestCode, payout.Amount, payout.BankName, payout.BankAccountNumber }),
            ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPayout(payout, includeSensitiveBankData: false);
    }

    public async Task<PagedResult<AffiliatePayoutItem>> GetPayoutsAsync(AffiliatePayoutListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetPayoutsAsync(query.PageNumber, query.PageSize, query.Status, query.Search, null, cancellationToken);
        // Only the Admin endpoint calls this method. The partner-facing API deliberately
        // receives the masked account above; reviewers need the full value to transfer money.
        return PagedResult<AffiliatePayoutItem>.Create(result.Items.Select(item => MapPayout(item, includeSensitiveBankData: true)), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<AffiliatePayoutItem> ReviewPayoutAsync(long id, ReviewAffiliatePayoutRequest request, int reviewerId, string? ipAddress, CancellationToken cancellationToken)
    {
        var payout = await repository.GetPayoutByIdAsync(id, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy yêu cầu rút tiền.");
        repository.SetOriginalRowVersion(payout, DecodeRowVersion(request.RowVersion));
        var oldStatus = payout.Status;
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        try
        {
            switch (request.Status)
            {
                case AffiliatePayoutStatus.Processing:
                    payout.StartProcessing(reviewerId, request.ReviewNote, utcNow);
                    break;
                case AffiliatePayoutStatus.Paid:
                    payout.MarkPaid(reviewerId, request.ReviewNote, utcNow);
                    break;
                case AffiliatePayoutStatus.Rejected:
                    payout.Reject(reviewerId, request.ReviewNote ?? string.Empty, utcNow);
                    break;
                default:
                    throw new RequestValidationException(nameof(request.Status), "Trạng thái đối soát không hợp lệ.");
            }
        }
        catch (ArgumentException exception)
        {
            throw new RequestValidationException(nameof(request.ReviewNote), exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            throw new ConflictException(exception.Message);
        }

        unitOfWork.AddAuditLog(new AuditLog(
            "Affiliate.PayoutStatusChanged",
            reviewerId,
            nameof(AffiliatePayout),
            payout.Id.ToString(),
            oldValues: JsonSerializer.Serialize(new { Status = oldStatus }),
            newValues: JsonSerializer.Serialize(new { payout.Status, payout.ReviewNote, payout.PaidAtUtc }),
            ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPayout(payout, includeSensitiveBankData: true);
    }

    public async Task RunMaintenanceAsync(CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var matured = await repository.GetMaturingAttributionsAsync(utcNow, cancellationToken);
        foreach (var attribution in matured) attribution.Mature(utcNow);

        var currentMonth = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var previousMonth = currentMonth.AddMonths(-1);
        var partners = await repository.GetActivePartnersAsync(cancellationToken);
        foreach (var partner in partners.Where(item => item.TierEvaluatedAtUtc is null || item.TierEvaluatedAtUtc < currentMonth))
        {
            var completed = await repository.GetCompletedOrdersAsync(partner.Id, previousMonth, currentMonth, cancellationToken);
            if (partner.TierEvaluatedAtUtc is null) completed += partner.ImportedConversionCount;
            partner.EvaluateTier(completed, utcNow);
        }
        if (matured.Count > 0 || partners.Any(item => item.UpdatedAt == utcNow)) await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<AffiliatePartner> PartnerAsync(int userId, CancellationToken cancellationToken) =>
        await repository.GetPartnerByUserIdAsync(userId, cancellationToken)
        ?? throw new ResourceNotFoundException("Tài khoản chưa được liên kết với một đối tác Affiliate đang hoạt động.");

    private async Task MatureLoadedPartnerAsync(AffiliatePartner partner, CancellationToken cancellationToken)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var changed = false;
        foreach (var attribution in partner.Attributions.Where(item => item.Status == AffiliateCommissionStatus.Pending && item.EligibleAtUtc is DateTime availableAt && availableAt <= utcNow))
        {
            attribution.Mature(utcNow);
            changed = true;
        }
        if (changed) await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<string> AllocatePayoutCodeAsync(CancellationToken cancellationToken)
    {
        const string alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var suffix = new string(Enumerable.Range(0, 10).Select(_ => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)]).ToArray());
            var code = $"PAY-{suffix}";
            if (!await repository.PayoutCodeExistsAsync(code, cancellationToken)) return code;
        }
        throw new ConflictException("Không thể cấp mã rút tiền duy nhất. Hãy thử lại.");
    }

    private static AffiliatePortalOrderItem MapOrder(AffiliateAttribution item) => new(
        item.OrderRequestId,
        item.OrderRequest.TrackingCode,
        MaskName(item.OrderRequest.CustomerName),
        item.OrderRequest.PlanNameSnapshot,
        item.RevenueSnapshot,
        item.CommissionAmount,
        item.CommissionRateSnapshot,
        item.Status,
        item.EligibleAtUtc,
        item.CreatedAt);

    private static AffiliatePayoutItem MapPayout(AffiliatePayout item, bool includeSensitiveBankData) => new(
        item.Id,
        item.RequestCode,
        item.AffiliatePartner.Code,
        item.AffiliatePartner.DisplayName,
        item.Amount,
        item.BankName,
        MaskAccount(item.BankAccountNumber),
        includeSensitiveBankData ? item.BankAccountNumber : null,
        item.BankAccountName,
        item.Status,
        item.RequestedAtUtc,
        item.PaidAtUtc,
        item.ReviewNote,
        Convert.ToBase64String(item.RowVersion));

    private static string MaskName(string name)
    {
        var parts = name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "Khách hàng";
        return string.Join(' ', parts.Select((part, index) => index == parts.Length - 1 ? $"{part[0]}***" : part));
    }

    private static string MaskAccount(string value) => value.Length <= 4 ? "****" : $"**** {value[^4..]}";

    private static (int Orders, string? Name) NextTier(int completedOrders, AffiliateTier tier) => tier switch
    {
        AffiliateTier.Newbie => (Math.Max(0, 5 - completedOrders), "Đồng"),
        AffiliateTier.Bronze => (Math.Max(0, 20 - completedOrders), "Bạc"),
        AffiliateTier.Silver => (Math.Max(0, 50 - completedOrders), "Vàng"),
        _ => (0, null)
    };

    private static IReadOnlyList<AffiliateWeeklyPerformance> BuildWeeklyPerformance(AffiliatePartner partner, DateTime utcNow)
    {
        var currentWeek = StartOfWeek(utcNow);
        return Enumerable.Range(0, 8)
            .Select(index =>
            {
                var weekStart = currentWeek.AddDays(-7 * (7 - index));
                var weekEnd = weekStart.AddDays(7);
                var completed = partner.Attributions
                    .Where(item => item.OrderRequest.Status == OrderRequestStatus.Done && item.CreatedAt >= weekStart && item.CreatedAt < weekEnd)
                    .ToArray();
                return new AffiliateWeeklyPerformance(
                    weekStart,
                    completed.Length,
                    completed.Sum(item => item.CommissionAmount));
            })
            .ToArray();
    }

    private static DateTime StartOfWeek(DateTime utcNow)
    {
        var date = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);
        var daysSinceMonday = ((int)date.DayOfWeek + 6) % 7;
        return date.AddDays(-daysSinceMonday);
    }

    private static byte[] DecodeRowVersion(string value)
    {
        try { var bytes = Convert.FromBase64String(value); return bytes.Length == 8 ? bytes : throw new FormatException(); }
        catch (FormatException) { throw new RequestValidationException(nameof(value), "Phiên bản yêu cầu rút tiền không hợp lệ. Hãy tải lại danh sách."); }
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber < 1 || pageSize is < 1 or > 100) throw new RequestValidationException("paging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100.");
    }
}
