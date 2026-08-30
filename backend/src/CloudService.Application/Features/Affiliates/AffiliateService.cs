using System.Security.Cryptography;
using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Affiliates.Models;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Affiliates;

public sealed class AffiliateService(
    IAffiliateRepository repository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IAffiliateCredentialNotifier credentialNotifier,
    IAffiliateProofService proofService,
    TimeProvider timeProvider) : IAffiliateService
{
    // Compatibility constructor keeps focused unit tests independent from the
    // signing implementation; Web API resolves the explicit proof service.
    public AffiliateService(
        IAffiliateRepository repository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IAffiliateCredentialNotifier credentialNotifier,
        TimeProvider timeProvider)
        : this(repository, unitOfWork, passwordHasher, credentialNotifier, CompatibilityProofService.Instance, timeProvider)
    {
    }

    public async Task<AffiliateApplicationSubmissionReceipt> CreateAsync(CreateAffiliateApplicationRequest request, CancellationToken cancellationToken)
    {
        string normalizedEmail;
        string normalizedPhone;
        string? normalizedWebsite;
        try
        {
            normalizedEmail = AffiliateApplication.NormalizeEmail(request.Email);
            normalizedPhone = AffiliateApplication.NormalizePhone(request.Phone);
            normalizedWebsite = AffiliateApplication.NormalizeWebsite(request.WebsiteOrChannel);
        }
        catch (ArgumentException exception)
        {
            throw new RequestValidationException("affiliateIdentity", exception.Message);
        }

        // The pre-check provides field-level feedback. Database unique indexes remain
        // authoritative when two submissions race between this query and SaveChanges.
        var duplicate = await repository.FindDuplicateApplicationFieldsAsync(
            normalizedEmail,
            normalizedPhone,
            normalizedWebsite,
            cancellationToken);
        if (duplicate.Any)
            throw AffiliateDuplicateException.From(duplicate.EmailExists, duplicate.PhoneExists, duplicate.WebsiteExists);

        var trackingCode = await AllocateApplicationTrackingCodeAsync(cancellationToken);
        var application = new AffiliateApplication(trackingCode, request.FullName, normalizedEmail, normalizedPhone);
        application.SetDetails(normalizedWebsite, request.Note);
        repository.Add(application);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new AffiliateApplicationSubmissionReceipt(application.TrackingCode, application.Status, application.CreatedAt);
    }

    public async Task<AffiliateApplicationTrackingItem> GetPublicStatusAsync(string trackingCode, CancellationToken cancellationToken)
    {
        string normalized;
        try
        {
            normalized = AffiliateApplication.NormalizeTrackingCode(trackingCode);
        }
        catch (ArgumentException exception)
        {
            throw new RequestValidationException(nameof(trackingCode), exception.Message);
        }

        var application = await repository.GetByTrackingCodeAsync(normalized, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy hồ sơ affiliate tương ứng.");

        // A referral code only becomes public after an operator has explicitly
        // approved the application; no review notes or contact data leave here.
        return new AffiliateApplicationTrackingItem(
            application.TrackingCode,
            application.Status,
            application.CreatedAt,
            application.UpdatedAt,
            application.Status == AffiliateApplicationStatus.Done ? application.Partner?.Code : null);
    }

    public async Task<PagedResult<AffiliateApplicationItem>> GetAsync(AffiliateListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var result = await repository.GetAsync(query.PageNumber, query.PageSize, query.Status, query.Search, cancellationToken);
        return PagedResult<AffiliateApplicationItem>.Create(result.Items.Select(Map), query.PageNumber, query.PageSize, result.TotalCount);
    }

    public async Task<AffiliateStatusUpdateResult> UpdateStatusAsync(long id, UpdateAffiliateStatusRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status)) throw new RequestValidationException(nameof(request.Status), "Trạng thái không hợp lệ.");
        var application = await repository.GetByIdAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy đăng ký affiliate.");
        if (application.Status != request.Status && !IsAllowed(application.Status, request.Status))
            throw new RequestValidationException(nameof(request.Status), "Không thể chuyển trạng thái theo quy trình.");

        var oldStatus = application.Status;
        application.ChangeStatus(request.Status, request.InternalNote);
        unitOfWork.AddAuditLog(new AuditLog("Affiliate.StatusChanged", userId, nameof(AffiliateApplication), application.Id.ToString(), oldValues: $"{{\"status\":\"{oldStatus}\"}}", newValues: $"{{\"status\":\"{request.Status}\"}}", ipAddress: ipAddress));
        ProvisionedAffiliateAccount? provisionedAccount = null;
        if (request.Status == AffiliateApplicationStatus.Done && application.Partner is null)
        {
            var code = string.IsNullOrWhiteSpace(request.AffiliateCode)
                ? await AllocateCodeAsync(cancellationToken)
                : AffiliatePartner.NormalizeCode(request.AffiliateCode);
            if (await repository.PartnerCodeExistsAsync(code, cancellationToken))
                throw new ConflictException("Mã affiliate đã được sử dụng. Hãy chọn mã khác.");
            var roleId = await repository.GetRoleIdAsync(RoleNames.Affiliate, cancellationToken);
            var userName = await AllocateUserNameAsync(application.FullName, application.TrackingCode, cancellationToken);
            var temporaryPassword = GenerateTemporaryPassword();
            if (await repository.UserEmailExistsAsync(application.Email.ToUpperInvariant(), cancellationToken))
                throw new ConflictException("Email hồ sơ đã thuộc một tài khoản hệ thống. Hãy dùng email khác trước khi duyệt.");

            var account = new AppUser(userName, application.FullName, application.Email, passwordHasher.Hash(temporaryPassword), roleId);
            account.RequirePasswordChange();
            // New partners always enter at Newbie (5%). A monthly tier evaluation is
            // the only writer of the rate, preventing an operator from bypassing policy.
            var partner = new AffiliatePartner(application.Id, code, application.FullName, 5m);
            repository.Add(account);
            repository.Add(partner);

            await unitOfWork.ExecuteInTransactionAsync(async transactionToken =>
            {
                await unitOfWork.SaveChangesAsync(transactionToken);
                partner.LinkAccount(account.Id);
                await unitOfWork.SaveChangesAsync(transactionToken);
                return true;
            }, cancellationToken);
            var emailDeliveryStatus = await credentialNotifier.SendAsync(application.Email, application.FullName, userName, temporaryPassword, cancellationToken);
            provisionedAccount = new ProvisionedAffiliateAccount(userName, temporaryPassword, true, emailDeliveryStatus);
        }

        if (provisionedAccount is null) await unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await repository.GetByIdAsync(id, cancellationToken) ?? application;
        return new AffiliateStatusUpdateResult(Map(saved), provisionedAccount);
    }

    public async Task<AffiliateApplicationItem> UpdateAsync(long id, UpdateAffiliateApplicationRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var application = await repository.GetByIdAsync(id, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy đăng ký affiliate.");
        var rowVersion = DecodeRowVersion(request.RowVersion);

        string email;
        string phone;
        string? website;
        try
        {
            email = AffiliateApplication.NormalizeEmail(request.Email);
            phone = AffiliateApplication.NormalizePhone(request.Phone);
            website = AffiliateApplication.NormalizeWebsite(request.WebsiteOrChannel);
        }
        catch (ArgumentException exception)
        {
            throw new RequestValidationException("affiliateIdentity", exception.Message);
        }

        var duplicate = await repository.FindDuplicateApplicationFieldsAsync(email, phone, website, cancellationToken, id);
        if (duplicate.Any)
            throw AffiliateDuplicateException.From(duplicate.EmailExists, duplicate.PhoneExists, duplicate.WebsiteExists);

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var before = new
        {
            application.FullName,
            application.Email,
            application.Phone,
            application.WebsiteOrChannel,
            application.Note,
            CommissionRate = application.Partner?.CommissionRate,
            PartnerIsActive = application.Partner?.IsActive
        };
        application.UpdateProfile(request.FullName, email, phone, website, request.Note, utcNow);

        // The partner code is immutable because it is copied into referral and order
        // snapshots. Operators may still correct the public name, rate and availability.
        if (application.Partner is not null)
        {
            application.Partner.Update(
                application.FullName,
                application.Partner.CommissionRate,
                request.PartnerIsActive ?? application.Partner.IsActive,
                utcNow);
        }

        repository.SetOriginalRowVersion(application, rowVersion);
        unitOfWork.AddAuditLog(new AuditLog(
            "Affiliate.ProfileUpdated",
            userId,
            nameof(AffiliateApplication),
            application.Id.ToString(),
            oldValues: JsonSerializer.Serialize(before),
            newValues: JsonSerializer.Serialize(new
            {
                application.FullName,
                application.Email,
                application.Phone,
                application.WebsiteOrChannel,
                application.Note,
                CommissionRate = application.Partner?.CommissionRate,
                PartnerIsActive = application.Partner?.IsActive
            }),
            ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var saved = await repository.GetByIdAsync(id, cancellationToken) ?? application;
        return Map(saved);
    }

    public async Task DeleteAsync(long id, DeleteAffiliateApplicationRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var application = await repository.GetByIdAsync(id, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy đăng ký affiliate.");
        repository.SetOriginalRowVersion(application, DecodeRowVersion(request.RowVersion));

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var archivedSnapshot = new
        {
            application.TrackingCode,
            application.IsDeleted,
            PartnerIsActive = application.Partner?.IsActive
        };
        application.SoftDelete(utcNow);
        if (application.Partner is not null && application.Partner.IsActive)
        {
            // Retain attribution history but stop the deleted partner code from
            // creating new referrals or commissions.
            application.Partner.Update(application.Partner.DisplayName, application.Partner.CommissionRate, false, utcNow);
        }

        unitOfWork.AddAuditLog(new AuditLog(
            "Affiliate.ApplicationArchived",
            userId,
            nameof(AffiliateApplication),
            application.Id.ToString(),
            oldValues: JsonSerializer.Serialize(archivedSnapshot),
            newValues: JsonSerializer.Serialize(new
            {
                application.TrackingCode,
                IsDeleted = true,
                PartnerIsActive = application.Partner is null ? (bool?)null : false
            }),
            ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
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
            return new ReferralTrackedResponse(false, null, null);
        }

        var partner = await repository.GetActivePartnerByCodeAsync(normalizedCode, cancellationToken);
        if (partner is null) return new ReferralTrackedResponse(false, null, null);

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var existing = await repository.GetReferralAsync(request.VisitId, cancellationToken);
        if (existing is not null)
        {
            var accepted = existing.AffiliatePartnerId == partner.Id && existing.IsValidAt(utcNow);
            return new ReferralTrackedResponse(
                accepted,
                existing.ExpiresAtUtc,
                accepted ? proofService.Create(normalizedCode, request.VisitId, utcNow) : null);
        }

        // Last-click attribution stays valid for 60 days, matching the public
        // partner policy and the cookie lifetime used by the Next.js client.
        var expiresAt = utcNow.AddDays(60);
        repository.Add(new AffiliateReferral(partner.Id, request.VisitId, expiresAt, request.LandingPath, request.Referrer));
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return new ReferralTrackedResponse(true, expiresAt, proofService.Create(normalizedCode, request.VisitId, utcNow));
        }
        catch (AffiliateReferralReservationException)
        {
            // Another request won the unique VisitId race. Re-read and return the
            // same deterministic result so React retries remain idempotent.
            var winner = await repository.GetReferralAsync(request.VisitId, cancellationToken);
            var accepted = winner is not null && winner.AffiliatePartnerId == partner.Id && winner.IsValidAt(timeProvider.GetUtcNow().UtcDateTime);
            return new ReferralTrackedResponse(
                accepted,
                winner?.ExpiresAtUtc,
                accepted ? proofService.Create(normalizedCode, request.VisitId, timeProvider.GetUtcNow().UtcDateTime) : null);
        }
    }

    private static bool IsAllowed(AffiliateApplicationStatus current, AffiliateApplicationStatus next) =>
        (current, next) switch
        {
            (AffiliateApplicationStatus.New, AffiliateApplicationStatus.Processing or AffiliateApplicationStatus.Rejected) => true,
            (AffiliateApplicationStatus.Processing, AffiliateApplicationStatus.Done or AffiliateApplicationStatus.Rejected) => true,
            (AffiliateApplicationStatus.Rejected, AffiliateApplicationStatus.Processing) => true,
            _ => false
        };

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber < 1 || pageSize is < 1 or > 100)
            throw new RequestValidationException("paging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100.");
    }

    private static byte[] DecodeRowVersion(string value)
    {
        try
        {
            var bytes = Convert.FromBase64String(value);
            if (bytes.Length != 8) throw new FormatException();
            return bytes;
        }
        catch (FormatException)
        {
            throw new RequestValidationException(nameof(value), "Phiên bản dữ liệu affiliate không hợp lệ. Hãy tải lại danh sách.");
        }
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

    private async Task<string> AllocateApplicationTrackingCodeAsync(CancellationToken cancellationToken)
    {
        const string alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        for (var attempt = 0; attempt < 8; attempt++)
        {
            var suffix = new char[12];
            for (var index = 0; index < suffix.Length; index++)
                suffix[index] = alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
            var code = "AFF-" + new string(suffix);
            if (!await repository.TrackingCodeExistsAsync(code, cancellationToken)) return code;
        }

        throw new InvalidOperationException("Không thể cấp mã theo dõi affiliate duy nhất.");
    }

    private async Task<string> AllocateUserNameAsync(string fullName, string trackingCode, CancellationToken cancellationToken)
    {
        var ascii = string.Concat(fullName.Normalize(System.Text.NormalizationForm.FormD)
            .Where(character => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(character) != System.Globalization.UnicodeCategory.NonSpacingMark && char.IsAsciiLetterOrDigit(character)))
            .ToLowerInvariant();
        var stem = string.IsNullOrWhiteSpace(ascii) ? "partner" : ascii;
        stem = stem[..Math.Min(stem.Length, 32)];
        var suffix = trackingCode.Replace("AFF-", string.Empty, StringComparison.Ordinal)[..4].ToLowerInvariant();
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var candidate = attempt == 0 ? $"aff_{stem}_{suffix}" : $"aff_{stem[..Math.Min(stem.Length, 27)]}_{suffix}{attempt}";
            if (!await repository.UserNameExistsAsync(candidate.ToUpperInvariant(), cancellationToken)) return candidate;
        }
        throw new ConflictException("Không thể cấp tên đăng nhập duy nhất cho đối tác.");
    }

    private static string GenerateTemporaryPassword()
    {
        const string lower = "abcdefghijkmnopqrstuvwxyz";
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string digits = "23456789";
        const string symbols = "@!#%";
        var required = new[]
        {
            lower[RandomNumberGenerator.GetInt32(lower.Length)],
            upper[RandomNumberGenerator.GetInt32(upper.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            symbols[RandomNumberGenerator.GetInt32(symbols.Length)]
        };
        var all = lower + upper + digits + symbols;
        var chars = required.Concat(Enumerable.Range(0, 10).Select(_ => all[RandomNumberGenerator.GetInt32(all.Length)])).ToArray();
        RandomNumberGenerator.Shuffle(chars);
        return new string(chars);
    }

    internal static AffiliateApplicationItem Map(AffiliateApplication item)
    {
        var partner = item.Partner;
        return new AffiliateApplicationItem(
            item.Id,
            item.TrackingCode,
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
            item.UpdatedAt,
            Convert.ToBase64String(item.RowVersion));
    }

    private sealed class CompatibilityProofService : IAffiliateProofService
    {
        public static readonly CompatibilityProofService Instance = new();
        public string Create(string normalizedAffiliateCode, Guid visitId, DateTime issuedAtUtc) => string.Empty;
        public bool IsValid(string proof, string normalizedAffiliateCode, Guid visitId, DateTime utcNow) => true;
    }
}
