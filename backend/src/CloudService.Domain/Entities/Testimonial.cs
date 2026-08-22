using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class Testimonial : AuditableEntity
{
    private Testimonial()
    {
    }

    public Testimonial(string customerName, string content, byte rating = 5, int displayOrder = 0)
    {
        if (rating is < 1 or > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(rating));
        }

        CustomerName = Guard.Required(customerName, nameof(customerName));
        Content = Guard.Required(content, nameof(content));
        Rating = rating;
        DisplayOrder = displayOrder >= 0 ? displayOrder : throw new ArgumentOutOfRangeException(nameof(displayOrder));
    }

    public string CustomerName { get; private set; } = string.Empty;
    public string? CompanyName { get; private set; }
    public string? Position { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public string? LogoUrl { get; private set; }
    public byte Rating { get; private set; } = 5;
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    public void Update(
        string customerName,
        string? companyName,
        string? position,
        string content,
        string? avatarUrl,
        string? logoUrl,
        byte rating,
        int displayOrder)
    {
        if (rating is < 1 or > 5) throw new ArgumentOutOfRangeException(nameof(rating));
        if (displayOrder < 0) throw new ArgumentOutOfRangeException(nameof(displayOrder));
        CustomerName = Guard.Required(customerName, nameof(customerName));
        CompanyName = string.IsNullOrWhiteSpace(companyName) ? null : companyName.Trim();
        Position = string.IsNullOrWhiteSpace(position) ? null : position.Trim();
        Content = Guard.Required(content, nameof(content));
        AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl.Trim();
        LogoUrl = string.IsNullOrWhiteSpace(logoUrl) ? null : logoUrl.Trim();
        Rating = rating;
        DisplayOrder = displayOrder;
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
