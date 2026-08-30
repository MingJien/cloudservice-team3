namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateProofService
{
    string Create(string normalizedAffiliateCode, Guid visitId, DateTime issuedAtUtc);
    bool IsValid(string proof, string normalizedAffiliateCode, Guid visitId, DateTime utcNow);
}
