using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing.Interfaces;

public interface IPricingService
{
    Task<PricingQuoteResponse> QuoteAsync(PricingQuoteRequest request, CancellationToken cancellationToken);
    Task<bool> TryReservePromotionUseAsync(string normalizedCode, int servicePlanId, DateTime utcNow, CancellationToken cancellationToken);
}
