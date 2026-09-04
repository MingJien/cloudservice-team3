using CloudService.Application.Features.Pricing.Models;

namespace CloudService.Application.Features.Pricing.Interfaces;

/// <summary>
/// Binds a short-lived public quote to the exact catalog inputs and calculated
/// amount.  The order command can therefore reject a quote that became stale
/// while the customer was still filling the form, without trusting a price
/// supplied by the browser.
/// </summary>
public interface IQuoteTokenService
{
    string Create(PricingQuoteResponse quote);

    bool IsValid(
        string token,
        PricingQuoteRequest request,
        PricingQuoteResponse currentQuote,
        DateTime utcNow);
}
