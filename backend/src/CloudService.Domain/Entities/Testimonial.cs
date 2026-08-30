using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class Testimonial : AuditableEntity
{
    public const decimal FeaturedOrderThreshold = 5_000_000m;

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
        ModerationStatus = TestimonialModerationStatus.Hidden;
        IsActive = false;
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
    public long? OrderRequestId { get; private set; }
    public bool IsVerifiedOrder { get; private set; }
    public bool IsFeaturedCustomer { get; private set; }
    public TestimonialModerationStatus ModerationStatus { get; private set; } = TestimonialModerationStatus.Pending;
    public OrderRequest? OrderRequest { get; private set; }

    public static Testimonial CreateFromCompletedOrder(OrderRequest order, string content, byte rating)
    {
        ArgumentNullException.ThrowIfNull(order);
        if (order.Status != OrderRequestStatus.Done)
        {
            throw new InvalidOperationException("Chỉ đơn hàng đã hoàn tất mới có thể gửi đánh giá.");
        }

        var testimonial = new Testimonial(order.CustomerName, content, rating)
        {
            CompanyName = string.IsNullOrWhiteSpace(order.CompanyName) ? null : order.CompanyName.Trim(),
            OrderRequestId = order.Id,
            IsVerifiedOrder = true,
            IsFeaturedCustomer = order.EstimatedAmount > FeaturedOrderThreshold,
            IsActive = false,
            ModerationStatus = TestimonialModerationStatus.Pending
        };

        return testimonial;
    }

    public void SetActive(bool isActive)
    {
        // Publishing is a moderation decision, not an editing shortcut. Only a
        // review created from a completed order may be presented as customer proof.
        if (isActive && !IsVerifiedOrder)
            throw new InvalidOperationException("Chỉ đánh giá gắn với đơn hoàn tất đã xác minh mới được công bố.");

        IsActive = isActive;
        ModerationStatus = isActive
            ? TestimonialModerationStatus.Published
            : ModerationStatus == TestimonialModerationStatus.Pending
                ? TestimonialModerationStatus.Pending
                : TestimonialModerationStatus.Hidden;
    }

    public void Hide()
    {
        IsActive = false;
        ModerationStatus = TestimonialModerationStatus.Hidden;
    }
}
