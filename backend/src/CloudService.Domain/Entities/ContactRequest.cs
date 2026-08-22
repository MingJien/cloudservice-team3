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
        TrackingCode = Guid.NewGuid().ToString("N");
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = Guard.Required(email, nameof(email));
        Subject = Guard.Required(subject, nameof(subject));
        Message = Guard.Required(message, nameof(message));
    }

    public string TrackingCode { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string? AdminReply { get; private set; }
    public DateTime? RepliedAt { get; private set; }
    public ContactRequestStatus Status { get; private set; } = ContactRequestStatus.New;

    public void SetPhone(string? phone) => Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();

    public void ChangeStatus(ContactRequestStatus status)
    {
        if (!Enum.IsDefined(status)) throw new ArgumentOutOfRangeException(nameof(status));
        if (status == Status) return;

        var isValidTransition = (Status, status) switch
        {
            (ContactRequestStatus.New, ContactRequestStatus.Read) => true,
            (ContactRequestStatus.Read, ContactRequestStatus.Replied) => true,
            _ => false
        };
        if (!isValidTransition) throw new InvalidOperationException($"Không thể chuyển liên hệ từ {Status} sang {status}.");
        Status = status;
    }

    public void Reply(string reply)
    {
        if (Status is not (ContactRequestStatus.New or ContactRequestStatus.Read or ContactRequestStatus.Replied))
            throw new InvalidOperationException($"Contact cannot be replied to while in {Status} status.");

        AdminReply = Guard.Required(reply, nameof(reply));
        RepliedAt = DateTime.UtcNow;
        Status = ContactRequestStatus.Replied;
    }
}
