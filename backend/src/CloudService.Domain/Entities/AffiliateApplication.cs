using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class AffiliateApplication : LongAuditableEntity
{
    private AffiliateApplication()
    {
    }

    public AffiliateApplication(string fullName, string email, string phone)
    {
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = Guard.Required(email, nameof(email));
        Phone = Guard.Required(phone, nameof(phone));
    }

    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? WebsiteOrChannel { get; private set; }
    public string? Note { get; private set; }
    public string? InternalNote { get; private set; }
    public AffiliateApplicationStatus Status { get; private set; } = AffiliateApplicationStatus.New;
}
