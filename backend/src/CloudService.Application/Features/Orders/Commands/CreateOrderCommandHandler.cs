using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Orders.Events;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using MediatR;

namespace CloudService.Application.Features.Orders.Commands;

public sealed class CreateOrderCommandHandler(
    IOrderRepository repository,
    IAffiliateRepository affiliateRepository,
    IIdempotencyStore idempotencyStore,
    IOutboxWriter outboxWriter,
    IUnitOfWork unitOfWork,
    IPricingService pricingService,
    IQuoteTokenService quoteTokenService,
    IAffiliateProofService affiliateProofService,
    IOrderRequestFactory orderRequestFactory,
    TimeProvider timeProvider)
    : IRequestHandler<CreateOrderCommand, Result<OrderCreatedResponse>>
{
    private const string IdempotencyScope = "OrderRequest.Create.v1";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public async Task<Result<OrderCreatedResponse>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.BillingCycle))
            return Result.Failure<OrderCreatedResponse>(new Error("Order.InvalidBillingCycle", "Chu kỳ thanh toán không hợp lệ."));

        var rawKey = request.IdempotencyKey.Trim();
        if (rawKey.Length is < 16 or > 128 || rawKey.Any(char.IsControl))
            return Result.Failure<OrderCreatedResponse>(new Error("Order.InvalidIdempotencyKey", "Idempotency-Key phải dài 16-128 ký tự hợp lệ."));

        var keyHash = Sha256(rawKey);
        var requestHash = CreateRequestHash(request);
        var existing = await idempotencyStore.FindAsync(IdempotencyScope, keyHash, cancellationToken);
        if (existing is not null) return Result.Success(ResolveExisting(existing, requestHash));

        try
        {
            var response = await unitOfWork.ExecuteInTransactionAsync(async transactionCancellationToken =>
            {
                var utcNow = timeProvider.GetUtcNow().UtcDateTime;
                var reservation = new ApiIdempotencyRecord(IdempotencyScope, keyHash, requestHash, utcNow.AddHours(24));
                idempotencyStore.Add(reservation);

                // Persist the reservation first. Its unique index serializes concurrent requests
                // with the same key; the surrounding transaction keeps it invisible until complete.
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);

                var quote = await pricingService.QuoteAsync(
                    new PricingQuoteRequest(request.ServicePlanId, request.BillingCycle, request.PromotionCode),
                    transactionCancellationToken);
                if (string.IsNullOrWhiteSpace(request.QuoteToken) ||
                    !quoteTokenService.IsValid(
                        request.QuoteToken,
                        new PricingQuoteRequest(request.ServicePlanId, request.BillingCycle, request.PromotionCode),
                        quote,
                        utcNow))
                {
                    // The quote is recalculated inside the same transaction as the
                    // order.  A stale token is a 409, not a silent price change.
                    throw new ConflictException("Báo giá đã hết hạn hoặc catalog vừa thay đổi. Vui lòng lập báo giá mới rồi gửi lại.");
                }
                if (quote.Promotion is not null)
                {
                    var reserved = await pricingService.TryReservePromotionUseAsync(
                        quote.Promotion.Code,
                        request.ServicePlanId,
                        quote.CalculatedAtUtc,
                        transactionCancellationToken);
                    if (!reserved)
                        throw new ConflictException("Mã khuyến mãi vừa hết lượt sử dụng hoặc không còn hợp lệ.");
                }

                var createRequest = new CreateOrderRequest
                {
                    ServicePlanId = request.ServicePlanId,
                    BillingCycle = request.BillingCycle,
                    PromotionCode = request.PromotionCode,
                    CustomerName = request.CustomerName,
                    Email = request.Email,
                    Phone = request.Phone,
                    CompanyName = request.CompanyName,
                    Note = request.Note,
                    QuoteToken = request.QuoteToken,
                    AffiliateCode = request.AffiliateCode,
                    AffiliateVisitId = request.AffiliateVisitId
                };
                var order = await orderRequestFactory.CreateAsync(createRequest, quote, transactionCancellationToken);
                repository.Add(order);

                var affiliateCode = await AttachAffiliateAsync(
                    order,
                    request.AffiliateCode,
                    request.AffiliateVisitId,
                    request.AffiliateProof,
                    utcNow,
                    transactionCancellationToken);
                var result = new OrderCreatedResponse(
                    order.TrackingCode,
                    order.PlanNameSnapshot,
                    order.BillingCycleSnapshot,
                    order.EstimatedAmount,
                    quote.Currency,
                    order.Status,
                    order.CreatedAt,
                    affiliateCode);

                outboxWriter.Enqueue(
                    "OrderCreatedV2",
                    new OrderCreatedV2(
                        Guid.NewGuid(),
                        order.TrackingCode,
                        order.PlanNameSnapshot,
                        order.BillingCycleSnapshot,
                        order.EstimatedAmount,
                        quote.Currency,
                        order.Status,
                        order.CustomerName,
                        order.Email,
                        order.Phone,
                        order.CompanyName,
                        order.PromotionCode,
                        affiliateCode,
                        utcNow),
                    utcNow);

                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                reservation.Complete(JsonSerializer.Serialize(result, SerializerOptions), StatusCodes.Created, utcNow);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                return result;
            }, cancellationToken);

            return Result.Success(response);
        }
        catch (IdempotencyReservationException)
        {
            var winner = await idempotencyStore.FindAsync(IdempotencyScope, keyHash, cancellationToken)
                ?? throw new ConflictException("Yêu cầu cùng Idempotency-Key đang được xử lý. Vui lòng thử lại sau ít giây.");
            return Result.Success(ResolveExisting(winner, requestHash));
        }
    }

    private async Task<string?> AttachAffiliateAsync(
        OrderRequest order,
        string? affiliateCode,
        Guid? visitId,
        string? proof,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(affiliateCode) && visitId is null && string.IsNullOrWhiteSpace(proof)) return null;
        if (string.IsNullOrWhiteSpace(affiliateCode) || visitId is null || string.IsNullOrWhiteSpace(proof))
            throw new ConflictException("Thông tin giới thiệu Affiliate không đầy đủ hoặc đã hết hạn.");

        string normalizedCode;
        try
        {
            normalizedCode = AffiliatePartner.NormalizeCode(affiliateCode);
        }
        catch (ArgumentException)
        {
            throw new ConflictException("Mã giới thiệu Affiliate không hợp lệ.");
        }

        if (!affiliateProofService.IsValid(proof, normalizedCode, visitId.Value, utcNow))
            throw new ConflictException("Thông tin giới thiệu Affiliate không hợp lệ hoặc đã hết hạn.");

        var partner = await affiliateRepository.GetActivePartnerByCodeAsync(normalizedCode, cancellationToken);
        if (partner is null) throw new ConflictException("Đối tác Affiliate không còn hoạt động.");

        var referral = await affiliateRepository.GetReferralAsync(visitId.Value, cancellationToken);
        if (referral is null || referral.AffiliatePartnerId != partner.Id || !referral.IsValidAt(utcNow))
            throw new ConflictException("Lượt giới thiệu Affiliate không tồn tại, đã hết hạn hoặc đã được chuyển đổi.");
        referral.MarkConverted(order, utcNow);

        affiliateRepository.Add(new AffiliateAttribution(partner, order, partner.Code, partner.CommissionRate));
        return partner.Code;
    }

    private static OrderCreatedResponse ResolveExisting(ApiIdempotencyRecord record, string requestHash)
    {
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(record.RequestHash),
                Encoding.ASCII.GetBytes(requestHash)))
            throw new ConflictException("Idempotency-Key đã được dùng cho một nội dung yêu cầu khác.");

        if (string.IsNullOrWhiteSpace(record.ResponseJson))
            throw new ConflictException("Yêu cầu cùng Idempotency-Key đang được xử lý. Vui lòng thử lại sau ít giây.");

        return JsonSerializer.Deserialize<OrderCreatedResponse>(record.ResponseJson, SerializerOptions)
            ?? throw new InvalidOperationException("Không thể đọc kết quả idempotency đã lưu.");
    }

    private static string CreateRequestHash(CreateOrderCommand request)
    {
        var canonical = JsonSerializer.Serialize(new
        {
            request.ServicePlanId,
            BillingCycle = request.BillingCycle.ToString(),
            PromotionCode = NormalizeOptional(request.PromotionCode)?.ToUpperInvariant(),
            CustomerName = request.CustomerName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            CompanyName = NormalizeOptional(request.CompanyName),
            Note = NormalizeOptional(request.Note),
            QuoteToken = NormalizeOptional(request.QuoteToken),
            AffiliateProof = NormalizeOptional(request.AffiliateProof),
            AffiliateCode = NormalizeOptional(request.AffiliateCode)?.ToUpperInvariant(),
            request.AffiliateVisitId
        }, SerializerOptions);
        return Sha256(canonical);
    }

    private static string Sha256(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static class StatusCodes
    {
        public const int Created = 201;
    }
}
