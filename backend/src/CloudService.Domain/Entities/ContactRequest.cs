using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class ContactRequest : LongAuditableEntity
{
    private ContactRequest()
    {
    }

    public ContactRequest(string fullName, string email, string subject, string message)
    {
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = Guard.Required(email, nameof(email));
        Subject = Guard.Required(subject, nameof(subject));
        Message = Guard.Required(message, nameof(message));
    }

    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public ContactRequestStatus Status { get; private set; } = ContactRequestStatus.New;
}
