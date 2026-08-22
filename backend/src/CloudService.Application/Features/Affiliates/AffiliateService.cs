using System.Security.Cryptography;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates;

public sealed class AffiliateService(
    IAffiliateRepository repository,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IAffiliateService
{
    public async Task<AffiliateApplicationItem> CreateAsync(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken)
    {
        var application = new AffiliateApplication(request.FullName, request.Email, request.Phone);
        application.SetDetails(request.WebsiteOrChannel, request.Note);
        repository.Add(application);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(application);
    }

    public async Task<PagedResult<AffiliateApplicationItem>> GetAsync(AffiliateListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetAsync(query.PageNumber, query.PageSize, query.Status, query.Search, cancellationToken);
        return PagedResult<AffiliateApplicationItem>.Create(result.Items.Select(Map), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<AffiliateApplicationItem> UpdateStatusAsync(long id, UpdateAffiliateStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status)) throw new RequestValidationException(nameof(request.Status), "Trạng thái không hợp lệ.");
        var application = await repository.GetByIdAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đăng ký affiliate.");
        if (application.Status != request.Status && !IsAllowed(application.Status, request.Status))
            throw new RequestValidationException(nameof(request.Status), "Không thể chuyển trạng thái theo quy trình.");

        var oldStatus = application.Status;
        application.ChangeStatus(request.Status, request.InternalNote);
        if (request.Status == AffiliateApplicationStatus.Done && application.Partner is null)
        {
            var code = string.IsNullOrWhiteSpace(request.AffiliateCode)
                ? await AllocateCodeAsync(cancellationToken)
                : AffiliatePartner.NormalizeCode(request.AffiliateCode);
            if (await repository.PartnerCodeExistsAsync(code, cancellationToken))
                throw new ConflictException("Mã affiliate đã được sử dụng. Hãy chọn mã khác.");
            repository.Add(new AffiliatePartner(application.Id, code, application.FullName, request.CommissionRate ?? 10m));
        }

        unitOfWork.AddAuditLog(new AuditLog("Affiliate.StatusChanged", userId, nameof(AffiliateApplication), application.Id.ToString(), oldValues: $"{{\"status\":\"{oldStatus}\"}}", newValues: $"{{\"status\":\"{request.Status}\"}}", ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await repository.GetByIdAsync(id, cancellationToken) ?? application;
        return Map(saved);
    }

    public async Task<ReferralTrackedResponse> TrackReferralAsync(TrackAffiliateReferralRequest request, CancellationToken cancellationToken)
    {
        if (request.VisitId == Guid.Empty)
            throw new RequestValidationException(nameof(request.VisitId), "VisitId không hợp lệ.");

        string normalizedCode;
        try
        {
            normalizedCode = AffiliatePartner.NormalizeCode(request.AffiliateCode);
        }
        catch (ArgumentException)
        {
            return new ReferralTrackedResponse(false, null);
        }

        var existing = await repository.GetReferralAsync(request.VisitId, cancellationToken);
        if (existing is not null) return new ReferralTrackedResponse(true, existing.ExpiresAtUtc);

        var partner = await repository.GetActivePartnerByCodeAsync(normalizedCode, cancellationToken);
        if (partner is null) return new ReferralTrackedResponse(false, null);

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = utcNow.AddDays(30);
        repository.Add(new AffiliateReferral(partner.Id, request.VisitId, expiresAt, request.LandingPath, request.Referrer));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new ReferralTrackedResponse(true, expiresAt);
    }

    private static bool IsAllowed(AffiliateApplicationStatus current, AffiliateApplicationStatus next) =>
        (current, next) switch
        {
            (AffiliateApplicationStatus.New, AffiliateApplicationStatus.Processing or AffiliateApplicationStatus.Rejected) => true,
            (AffiliateApplicationStatus.Processing, AffiliateApplicationStatus.Done or AffiliateApplicationStatus.Rejected) => true,
            _ => false
        };

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber < 1 || pageSize is < 1 or > 100)
            throw new RequestValidationException("paging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100.");
    }

    private async Task<string> AllocateCodeAsync(CancellationToken cancellationToken)
    {
        const string alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var suffix = new char[8];
            for (var index = 0; index < suffix.Length; index++)
                suffix[index] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
            var code = "AFF-" + new string(suffix);
            if (!await repository.PartnerCodeExistsAsync(code, cancellationToken)) return code;
        }
        throw new InvalidOperationException("Không thể cấp mã affiliate duy nhất.");
    }

    internal static AffiliateApplicationItem Map(AffiliateApplication item)
    {
        var partner = item.Partner;
        return new AffiliateApplicationItem(
            item.Id,
            item.FullName,
            item.Email,
            item.Phone,
            item.WebsiteOrChannel,
            item.Note,
            item.InternalNote,
            item.Status,
            partner?.Code,
            partner?.CommissionRate,
            partner?.IsActive,
            partner?.Referrals.Count ?? 0,
            partner?.Attributions.Count ?? 0,
            partner?.Attributions.Where(attribution => attribution.Status == AffiliateCommissionStatus.Pending).Sum(attribution => attribution.CommissionAmount) ?? 0m,
            item.CreatedAt,
            item.UpdatedAt);
    }
}
