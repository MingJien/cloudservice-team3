using System.Security.Cryptography;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Orders.Models;
using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Entities;

namespace CloudService.Application.Features.Orders;

/// <summary>
/// Centralizes aggregate construction and cryptographically random tracking-code allocation.
/// </summary>
public sealed class OrderRequestFactory(IOrderRepository repository) : IOrderRequestFactory
{
    // Ambiguous characters (0/O, 1/I) are excluded so codes remain easy to read over phone/chat.
    private const string Alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    public async Task<OrderRequest> CreateAsync(
        CreateOrderRequest request,
        PricingQuoteResponse quote,
        CancellationToken cancellationToken)
    {
        var trackingCode = await AllocateTrackingCodeAsync(cancellationToken);
        var order = new OrderRequest(
            trackingCode,
            request.CustomerName,
            request.Email,
            request.Phone,
            request.ServicePlanId,
            quote.PlanPriceId,
            quote.PlanName,
            request.BillingCycle,
            quote.EffectivePlanPrice,
            quote.PromotionDiscountAmount);
        order.SetPromotion(request.PromotionCode, quote.PromotionDiscountAmount);
        order.SetCustomerDetails(request.CompanyName, request.Note);
        return order;
    }

    private async Task<string> AllocateTrackingCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var suffix = new char[10];
            for (var index = 0; index < suffix.Length; index++)
                suffix[index] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];

            var code = "ORD-" + new string(suffix);
            if (!await repository.TrackingCodeExistsAsync(code, cancellationToken)) return code;
        }

        throw new InvalidOperationException("Không thể cấp mã tra cứu duy nhất sau nhiều lần thử.");
    }
}
