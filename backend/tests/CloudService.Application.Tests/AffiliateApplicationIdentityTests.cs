using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Affiliates;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Entities;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class AffiliateApplicationIdentityTests
{
    [Fact]
    public async Task Create_duplicate_identity_returns_field_errors_without_writing()
    {
        var repository = new Mock<IAffiliateRepository>();
        var unitOfWork = new Mock<IUnitOfWork>();
        repository
            .Setup(item => item.FindDuplicateApplicationFieldsAsync(
                "partner@example.com",
                "0900000000",
                "https://partner.example.com/channel",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AffiliateDuplicateFields(true, false, true));
        var service = new AffiliateService(repository.Object, unitOfWork.Object, Mock.Of<IPasswordHasher>(), Mock.Of<IAffiliateCredentialNotifier>(), TimeProvider.System);

        var exception = await Assert.ThrowsAsync<AffiliateDuplicateException>(() => service.CreateAsync(
            ValidRequest(),
            CancellationToken.None));

        Assert.Contains("email", exception.Errors.Keys);
        Assert.Contains("websiteOrChannel", exception.Errors.Keys);
        repository.Verify(item => item.Add(It.IsAny<AffiliateApplication>()), Times.Never);
        unitOfWork.Verify(item => item.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Create_unique_identity_persists_canonical_values()
    {
        var repository = new Mock<IAffiliateRepository>();
        var unitOfWork = new Mock<IUnitOfWork>();
        AffiliateApplication? saved = null;
        repository
            .Setup(item => item.FindDuplicateApplicationFieldsAsync(
                "partner@example.com",
                "0900000000",
                "https://partner.example.com/channel",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AffiliateDuplicateFields(false, false, false));
        repository.Setup(item => item.Add(It.IsAny<AffiliateApplication>()))
            .Callback<AffiliateApplication>(item => saved = item);
        repository.Setup(item => item.TrackingCodeExistsAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        unitOfWork.Setup(item => item.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var service = new AffiliateService(repository.Object, unitOfWork.Object, Mock.Of<IPasswordHasher>(), Mock.Of<IAffiliateCredentialNotifier>(), TimeProvider.System);

        await service.CreateAsync(ValidRequest(), CancellationToken.None);

        Assert.NotNull(saved);
        Assert.Equal("partner@example.com", saved.Email);
        Assert.Equal("0900000000", saved.Phone);
        Assert.Equal("https://partner.example.com/channel", saved.WebsiteOrChannel);
        Assert.Matches("^AFF-[A-Z0-9]{12}$", saved.TrackingCode);
        unitOfWork.Verify(item => item.SaveChangesAsync(CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task Public_tracking_returns_only_the_safe_status_projection()
    {
        var repository = new Mock<IAffiliateRepository>();
        var unitOfWork = new Mock<IUnitOfWork>();
        var application = new AffiliateApplication("AFF-PRIVACY2026", "Nguyễn Minh An", "partner@example.com", "0900000000");
        application.ChangeStatus(CloudService.Domain.Enums.AffiliateApplicationStatus.Processing, "Ghi chú chỉ dành cho nội bộ.");
        repository.Setup(item => item.GetByTrackingCodeAsync("AFF-PRIVACY2026", It.IsAny<CancellationToken>()))
            .ReturnsAsync(application);
        var service = new AffiliateService(repository.Object, unitOfWork.Object, Mock.Of<IPasswordHasher>(), Mock.Of<IAffiliateCredentialNotifier>(), TimeProvider.System);

        var result = await service.GetPublicStatusAsync("aff-privacy2026", CancellationToken.None);
        var publicPropertyNames = typeof(AffiliateApplicationTrackingItem)
            .GetProperties()
            .Select(property => property.Name)
            .ToHashSet(StringComparer.Ordinal);

        Assert.Equal("AFF-PRIVACY2026", result.TrackingCode);
        Assert.Equal(CloudService.Domain.Enums.AffiliateApplicationStatus.Processing, result.Status);
        Assert.Null(result.AffiliateCode);
        Assert.DoesNotContain("FullName", publicPropertyNames);
        Assert.DoesNotContain("Email", publicPropertyNames);
        Assert.DoesNotContain("Phone", publicPropertyNames);
        Assert.DoesNotContain("InternalNote", publicPropertyNames);
    }

    private static CreateAffiliateApplicationRequest ValidRequest() => new()
    {
        FullName = "Nguyễn Minh An",
        Email = " Partner@Example.COM ",
        Phone = "0900000000",
        WebsiteOrChannel = "https://PARTNER.example.com/channel/#overview",
        Note = "Kênh chuyên chia sẻ kinh nghiệm vận hành cloud."
    };
}
