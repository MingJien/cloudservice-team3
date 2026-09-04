using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using CloudService.Application.Features.Affiliates.Interfaces;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Authentication;

/// <summary>
/// The browser may request attribution, but it cannot mint an attribution
/// credential. The proof is an HMAC envelope over the approved partner code,
/// one visit id and a 60-day expiry; orders accept those values only together.
/// </summary>
public sealed class HmacAffiliateProofService(IOptions<JwtOptions> options) : IAffiliateProofService
{
    private const int LifetimeDays = 60;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly byte[] signingKey = SHA256.HashData(
        Encoding.UTF8.GetBytes("affiliate-proof:" + options.Value.Secret));

    public string Create(string normalizedAffiliateCode, Guid visitId, DateTime issuedAtUtc)
    {
        var payload = Base64UrlEncode(JsonSerializer.SerializeToUtf8Bytes(
            new ProofEnvelope(
                normalizedAffiliateCode,
                visitId,
                new DateTimeOffset(issuedAtUtc.AddDays(LifetimeDays), TimeSpan.Zero).ToUnixTimeSeconds()),
            JsonOptions));
        return $"{payload}.{Sign(payload)}";
    }

    public bool IsValid(string proof, string normalizedAffiliateCode, Guid visitId, DateTime utcNow)
    {
        if (string.IsNullOrWhiteSpace(proof)) return false;
        var parts = proof.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2 || parts[0].Length > 4096 || parts[1].Length > 256) return false;

        try
        {
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.ASCII.GetBytes(Sign(parts[0])),
                    Encoding.ASCII.GetBytes(parts[1]))) return false;

            var envelope = JsonSerializer.Deserialize<ProofEnvelope>(Base64UrlDecode(parts[0]), JsonOptions);
            return envelope is not null
                && envelope.ExpiresAtUnix > new DateTimeOffset(utcNow, TimeSpan.Zero).ToUnixTimeSeconds()
                && envelope.VisitId == visitId
                && string.Equals(envelope.AffiliateCode, normalizedAffiliateCode, StringComparison.Ordinal);
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

    private string Sign(string payload) =>
        Base64UrlEncode(HMACSHA256.HashData(signingKey, Encoding.ASCII.GetBytes(payload)));

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');
        return Convert.FromBase64String(padded);
    }

    private sealed record ProofEnvelope(string AffiliateCode, Guid VisitId, long ExpiresAtUnix);
}
