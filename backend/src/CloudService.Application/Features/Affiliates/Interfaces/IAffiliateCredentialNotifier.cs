namespace CloudService.Application.Features.Affiliates.Interfaces;

public interface IAffiliateCredentialNotifier
{
    Task<string> SendAsync(string email, string fullName, string userName, string temporaryPassword, CancellationToken cancellationToken);
}
