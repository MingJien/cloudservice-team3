using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class AffiliateApplication : LongAuditableEntity, ISoftDelete
{
    private AffiliateApplication()
    {
    }

    public AffiliateApplication(string trackingCode, string fullName, string email, string phone)
    {
        TrackingCode = NormalizeTrackingCode(trackingCode);
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = NormalizeEmail(email);
        Phone = NormalizePhone(phone);
    }

    public string TrackingCode { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Phone { get; private set; } = string.Empty;
    public string? WebsiteOrChannel { get; private set; }
    public string? Note { get; private set; }
    public string? InternalNote { get; private set; }
    public AffiliateApplicationStatus Status { get; private set; } = AffiliateApplicationStatus.New;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAtUtc { get; private set; }
    public byte[] RowVersion { get; private set; } = [];
    public AffiliatePartner? Partner { get; private set; }

    public void UpdateProfile(string fullName, string email, string phone, string? websiteOrChannel, string? note, DateTime utcNow)
    {
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = NormalizeEmail(email);
        Phone = NormalizePhone(phone);
        WebsiteOrChannel = NormalizeWebsite(websiteOrChannel);
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        MarkUpdated(utcNow);
    }

    public void SetDetails(string? websiteOrChannel, string? note)
    {
        WebsiteOrChannel = NormalizeWebsite(websiteOrChannel);
        Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }

    public static string NormalizeEmail(string value) =>
        Guard.Required(value, nameof(value)).ToLowerInvariant();

    public static string NormalizeTrackingCode(string value)
    {
        var normalized = Guard.Required(value, nameof(value)).Trim().ToUpperInvariant();
        if (normalized.Length is < 12 or > 40 || !normalized.StartsWith("AFF-", StringComparison.Ordinal) ||
            normalized.Any(character => !((character is >= 'A' and <= 'Z') || (character is >= '0' and <= '9') || character == '-')))
        {
            throw new ArgumentException("Mã theo dõi affiliate không hợp lệ.", nameof(value));
        }

        return normalized;
    }

    public static string NormalizePhone(string value)
    {
        var normalized = new string(Guard.Required(value, nameof(value)).Where(char.IsDigit).ToArray());
        if (normalized.Length != 10 || normalized[0] != '0')
            throw new ArgumentException("Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0.", nameof(value));
        return normalized;
    }

    public static string? NormalizeWebsite(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (!Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("Website hoặc kênh giới thiệu phải là URL HTTPS hợp lệ.", nameof(value));

        var builder = new UriBuilder(uri)
        {
            Scheme = Uri.UriSchemeHttps,
            Host = uri.Host.ToLowerInvariant(),
            Port = -1,
            Fragment = string.Empty
        };
        var canonical = builder.Uri.AbsoluteUri;
        return canonical.TrimEnd('/');
    }

    public void ChangeStatus(AffiliateApplicationStatus status, string? internalNote)
    {
        if (!Enum.IsDefined(status)) throw new ArgumentOutOfRangeException(nameof(status));
        Status = status;
        InternalNote = string.IsNullOrWhiteSpace(internalNote) ? InternalNote : internalNote.Trim();
    }

    public void SoftDelete(DateTime utcNow)
    {
        IsDeleted = true;
        DeletedAtUtc = utcNow;
        MarkUpdated(utcNow);
    }

    public void SoftDelete() => SoftDelete(DateTime.UtcNow);

    public void Restore()
    {
        IsDeleted = false;
        DeletedAtUtc = null;
    }
}
