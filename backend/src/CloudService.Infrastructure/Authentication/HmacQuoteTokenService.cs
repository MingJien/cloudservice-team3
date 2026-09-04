using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Models;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Authentication;

/// <summary>
/// A quote is a user-facing preview, not an authorization to charge money.
/// This compact HMAC envelope gives the order transaction a tamper-evident
/// snapshot and a bounded lifetime while keeping the pricing policy in the
/// Application layer.
/// </summary>
public sealed class HmacQuoteTokenService(IOptions<JwtOptions> options) : IQuoteTokenService
{
    private const int LifetimeMinutes = 10;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly byte[] signingKey = Encoding.UTF8.GetBytes(options.Value.Secret);

    public string Create(PricingQuoteResponse quote)
    {
        var expiresAt = quote.CalculatedAtUtc.AddMinutes(LifetimeMinutes);
        var envelope = new QuoteEnvelope(
            quote.ServicePlanId,
            quote.PlanPriceId,
            quote.BillingCycle.ToString(),
            quote.Promotion?.Code,
            quote.TotalPrice,
            quote.Currency,
            new DateTimeOffset(expiresAt, TimeSpan.Zero).ToUnixTimeSeconds());
        var payload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(envelope, JsonOptions));
        return $"{payload}.{Sign(payload)}";
    }

    public bool IsValid(string token, PricingQuoteRequest request, PricingQuoteResponse currentQuote, DateTime utcNow)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        var parts = token.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2 || parts[0].Length > 4096 || parts[1].Length > 256) return false;

        try
        {
            var expectedSignature = Sign(parts[0]);
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.ASCII.GetBytes(expectedSignature),
                    Encoding.ASCII.GetBytes(parts[1]))) return false;

            var envelope = JsonSerializer.Deserialize<QuoteEnvelope>(Base64UrlDecode(parts[0]), JsonOptions);
            if (envelope is null || envelope.ExpiresAtUnix <= new DateTimeOffset(utcNow, TimeSpan.Zero).ToUnixTimeSeconds()) return false;

            var requestedPromotion = string.IsNullOrWhiteSpace(request.PromotionCode)
                ? null
                : request.PromotionCode.Trim().ToUpperInvariant();
            return envelope.ServicePlanId == request.ServicePlanId
                && envelope.PlanPriceId == currentQuote.PlanPriceId
                && envelope.BillingCycle == request.BillingCycle.ToString()
                && string.Equals(envelope.PromotionCode, requestedPromotion, StringComparison.Ordinal)
                && envelope.TotalPrice == currentQuote.TotalPrice
                && string.Equals(envelope.Currency, currentQuote.Currency, StringComparison.Ordinal);
        }
        catch (JsonException)
        {
            return false;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private string Sign(string payload)
    {
        var signature = HMACSHA256.HashData(signingKey, Encoding.ASCII.GetBytes(payload));
        return Base64UrlEncode(signature);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');
        return Convert.FromBase64String(padded);
    }

    private sealed record QuoteEnvelope(
        int ServicePlanId,
        int PlanPriceId,
        string BillingCycle,
        string? PromotionCode,
        decimal TotalPrice,
        string Currency,
        long ExpiresAtUnix);
}
