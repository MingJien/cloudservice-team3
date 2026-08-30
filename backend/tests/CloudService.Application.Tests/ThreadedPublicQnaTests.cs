using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Content;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Content.Models;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class ThreadedPublicQnaTests
{
    [Fact]
    public async Task Follow_up_inherits_public_parent_subject_and_keeps_relationship()
    {
        var parent = PublicParent();
        var repository = new Mock<IContentRepository>();
        var unitOfWork = new Mock<IUnitOfWork>();
        repository.Setup(item => item.GetContactAsync(42, It.IsAny<CancellationToken>())).ReturnsAsync(parent);
        unitOfWork.Setup(item => item.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var service = new ContentService(repository.Object, Mock.Of<IOrderRepository>(), unitOfWork.Object, TimeProvider.System);

        var result = await service.CreateContactAsync(new CreateContactRequest
        {
            FullName = "Nguyễn Minh An",
            Email = "an@example.vn",
            Subject = "Chủ đề do trình duyệt gửi lên không được tin cậy",
            Message = "Nếu cần tăng CPU giữa chu kỳ thì quy trình xử lý thế nào?",
            ParentContactRequestId = 42
        }, CancellationToken.None);

        Assert.Equal(42, result.ParentContactRequestId);
        Assert.Equal("VPS Mekong Pro", result.Subject);
        repository.Verify(item => item.Add(It.Is<ContactRequest>(contact =>
            contact.ParentContactRequestId == 42 && contact.Subject == "VPS Mekong Pro")), Times.Once);
    }

    [Fact]
    public async Task Follow_up_to_unanswered_question_is_rejected()
    {
        var parent = new ContactRequest("REQ-260823-PARENT", "Khách", "guest@example.vn", "VPS", "Câu hỏi chưa trả lời");
        SetId(parent, 42);
        var repository = new Mock<IContentRepository>();
        repository.Setup(item => item.GetContactAsync(42, It.IsAny<CancellationToken>())).ReturnsAsync(parent);
        var service = new ContentService(repository.Object, Mock.Of<IOrderRepository>(), Mock.Of<IUnitOfWork>(), TimeProvider.System);

        await Assert.ThrowsAsync<ConflictException>(() => service.CreateContactAsync(new CreateContactRequest
        {
            FullName = "Nguyễn Minh An",
            Email = "an@example.vn",
            Subject = "VPS",
            Message = "Hỏi tiếp khi câu gốc chưa được trả lời",
            ParentContactRequestId = 42
        }, CancellationToken.None));

        repository.Verify(item => item.Add(It.IsAny<ContactRequest>()), Times.Never);
    }

    private static ContactRequest PublicParent()
    {
        var parent = new ContactRequest("REQ-260823-PARENT", "Khách", "guest@example.vn", "VPS Mekong Pro", "Có nâng cấp được không?");
        SetId(parent, 42);
        parent.Reply("Có, đội ngũ sẽ báo phần chênh lệch trước khi thay đổi.", ContactResponderRole.Admin);
        return parent;
    }

    private static void SetId(ContactRequest item, long id) =>
        typeof(LongAuditableEntity).GetProperty(nameof(LongAuditableEntity.Id))!.SetValue(item, id);
}
