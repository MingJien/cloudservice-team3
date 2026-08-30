using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Xunit;

namespace CloudService.Domain.Tests;

public sealed class VerifiedTestimonialTests
{
    [Fact]
    public void Completed_order_above_threshold_creates_pending_featured_testimonial()
    {
        var order = CompletedOrder(5_000_001m);

        var testimonial = Testimonial.CreateFromCompletedOrder(order, "Quy trình tư vấn rõ ràng và triển khai đúng nhu cầu.", 5);

        Assert.True(testimonial.IsVerifiedOrder);
        Assert.True(testimonial.IsFeaturedCustomer);
        Assert.False(testimonial.IsActive);
        Assert.Equal(TestimonialModerationStatus.Pending, testimonial.ModerationStatus);
        Assert.Equal(order.CustomerName, testimonial.CustomerName);
    }

    [Fact]
    public void Order_exactly_at_threshold_is_not_featured()
    {
        var testimonial = Testimonial.CreateFromCompletedOrder(
            CompletedOrder(Testimonial.FeaturedOrderThreshold),
            "Phản hồi hợp lệ cho bài kiểm tra ranh giới giá trị đơn.",
            4);

        Assert.False(testimonial.IsFeaturedCustomer);
    }

    [Fact]
    public void Non_completed_order_cannot_create_verified_testimonial()
    {
        var order = NewOrder(8_000_000m);

        Assert.Throws<InvalidOperationException>(() =>
            Testimonial.CreateFromCompletedOrder(order, "Nội dung chưa được phép gửi.", 5));
    }

    [Fact]
    public void Moderation_distinguishes_pending_published_and_hidden_without_mutating_customer_content()
    {
        var testimonial = Testimonial.CreateFromCompletedOrder(
            CompletedOrder(2_000_000m),
            "Nội dung gốc của khách phải được giữ nguyên.",
            4);

        testimonial.SetActive(true);
        Assert.Equal(TestimonialModerationStatus.Published, testimonial.ModerationStatus);
        Assert.True(testimonial.IsActive);

        testimonial.Hide();
        Assert.Equal(TestimonialModerationStatus.Hidden, testimonial.ModerationStatus);
        Assert.False(testimonial.IsActive);
        Assert.Equal("Nội dung gốc của khách phải được giữ nguyên.", testimonial.Content);
        Assert.Equal(4, testimonial.Rating);
    }

    [Fact]
    public void Administrator_authored_legacy_record_cannot_be_published_as_verified_customer_proof()
    {
        var legacy = new Testimonial("Marketing", "Nội dung do quản trị tạo.", 5);

        Assert.Throws<InvalidOperationException>(() => legacy.SetActive(true));
        Assert.False(legacy.IsActive);
        Assert.Equal(TestimonialModerationStatus.Hidden, legacy.ModerationStatus);
    }

    private static OrderRequest CompletedOrder(decimal amount)
    {
        var order = NewOrder(amount);
        order.ChangeStatus(OrderRequestStatus.Processing, "Đã tiếp nhận kiểm thử");
        order.ChangeStatus(OrderRequestStatus.Done, "Hoàn tất kiểm thử");
        return order;
    }

    private static OrderRequest NewOrder(decimal amount) => new(
        "ORD-TEST-001",
        "Nguyễn Minh An",
        "an@example.com",
        "0912345678",
        1,
        1,
        "VPS Business",
        BillingCycle.Monthly,
        amount,
        0m);
}
