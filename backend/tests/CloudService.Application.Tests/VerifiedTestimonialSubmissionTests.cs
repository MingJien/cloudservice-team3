using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Content;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Content.Models;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class VerifiedTestimonialSubmissionTests
{
    [Fact]
    public async Task Submit_completed_order_adds_pending_testimonial_and_saves()
    {
        var fixture = new Fixture(CompletedOrder(7_000_000m));

        var result = await fixture.Service.SubmitTestimonialAsync(
            new SubmitTestimonialRequest { TrackingCode = " ord-test-001 ", Content = "Hỗ trợ rõ ràng, trạng thái đơn dễ theo dõi.", Rating = 5, ConsentToPublish = true },
            CancellationToken.None);

        Assert.True(result.IsPendingModeration);
        Assert.True(result.IsFeaturedCustomer);
        fixture.ContentRepository.Verify(repository => repository.Add(It.Is<Testimonial>(item =>
            item.IsVerifiedOrder && item.IsFeaturedCustomer && !item.IsActive)), Times.Once);
        fixture.UnitOfWork.Verify(unit => unit.SaveChangesAsync(CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Submit_duplicate_order_returns_conflict_without_saving()
    {
        var fixture = new Fixture(CompletedOrder(2_000_000m), testimonialExists: true);

        await Assert.ThrowsAsync<ConflictException>(() => fixture.Service.SubmitTestimonialAsync(
            new SubmitTestimonialRequest { TrackingCode = "ORD-TEST-001", Content = "Đây là phản hồi gửi trùng cho cùng đơn hàng.", Rating = 4, ConsentToPublish = true },
            CancellationToken.None));

        fixture.UnitOfWork.Verify(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Submit_non_completed_order_returns_conflict()
    {
        var fixture = new Fixture(NewOrder(2_000_000m));

        await Assert.ThrowsAsync<ConflictException>(() => fixture.Service.SubmitTestimonialAsync(
            new SubmitTestimonialRequest { TrackingCode = "ORD-TEST-001", Content = "Đơn chưa hoàn tất nên chưa thể đánh giá.", Rating = 4, ConsentToPublish = true },
            CancellationToken.None));
    }

    [Fact]
    public async Task Submit_without_publication_consent_is_rejected_before_order_lookup()
    {
        var fixture = new Fixture(CompletedOrder(2_000_000m));

        await Assert.ThrowsAsync<RequestValidationException>(() => fixture.Service.SubmitTestimonialAsync(
            new SubmitTestimonialRequest { TrackingCode = "ORD-TEST-001", Content = "Nội dung không có đồng ý công bố.", Rating = 5, ConsentToPublish = false },
            CancellationToken.None));

        fixture.OrderRepository.Verify(repository => repository.GetByTrackingCodeAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private sealed class Fixture
    {
        public Fixture(OrderRequest order, bool testimonialExists = false)
        {
            ContentRepository.Setup(repository => repository.TestimonialExistsForOrderAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(testimonialExists);
            OrderRepository.Setup(repository => repository.GetByTrackingCodeAsync("ORD-TEST-001", It.IsAny<CancellationToken>())).ReturnsAsync(order);
            UnitOfWork.Setup(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
            Service = new ContentService(ContentRepository.Object, OrderRepository.Object, UnitOfWork.Object, TimeProvider.System);
        }

        public Mock<IContentRepository> ContentRepository { get; } = new();
        public Mock<IOrderRepository> OrderRepository { get; } = new();
        public Mock<IUnitOfWork> UnitOfWork { get; } = new();
        public ContentService Service { get; }
    }

    private static OrderRequest CompletedOrder(decimal amount)
    {
        var order = NewOrder(amount);
        order.ChangeStatus(OrderRequestStatus.Processing, "Đang xử lý kiểm thử");
        order.ChangeStatus(OrderRequestStatus.Done, "Hoàn tất kiểm thử");
        return order;
    }

    private static OrderRequest NewOrder(decimal amount) => new(
        "ORD-TEST-001", "Nguyễn Minh An", "an@example.com", "0912345678",
        1, 1, "VPS Business", BillingCycle.Monthly, amount, 0m);
}
