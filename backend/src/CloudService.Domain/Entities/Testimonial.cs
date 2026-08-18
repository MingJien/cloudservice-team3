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
}
