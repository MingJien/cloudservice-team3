using System.Text.Json;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Application.Features.Services.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Services;

public sealed class ServiceCatalogService(
    IServiceCatalogRepository repository,
    IUnitOfWork unitOfWork,
    IQrCodeGenerator qrCodeGenerator,
    TimeProvider timeProvider) : IServiceCatalogService
{
    public async Task<IReadOnlyCollection<ServiceCategoryItem>> GetPublicCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = await repository.GetCategoriesAsync(false, cancellationToken);
        return categories.Select(MapCategory).ToArray();
    }

    public async Task<PagedResult<ServicePlanItem>> GetPublicPlansAsync(ServicePlanListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var plans = await repository.GetPlansAsync(query.PageNumber, query.PageSize, query.Search, query.CategorySlug, false, cancellationToken);
        return PagedResult<ServicePlanItem>.Create(plans.Items.Select(MapPublicPlan), query.PageNumber, query.PageSize, plans.TotalCount);
    }

    public async Task<IReadOnlyCollection<ServicePlanItem>> GetFeaturedPlansAsync(CancellationToken cancellationToken)
    {
        var plans = await repository.GetFeaturedPlansAsync(cancellationToken);
        return plans.Select(MapPublicPlan).ToArray();
    }

    public async Task<ServicePlanItem> GetPublicPlanAsync(string slug, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanBySlugAsync(slug.Trim().ToLowerInvariant(), false, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        return MapPublicPlan(plan);
    }

    public async Task<ServicePlanItem> GetPublicPlanByIdAsync(int id, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(id, cancellationToken);
        if (plan is null || plan.IsDeleted || !plan.IsActive || plan.Category is null || plan.Category.IsDeleted || !plan.Category.IsActive) throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        return MapPublicPlan(plan);
    }

    public async Task<PagedResult<ServiceCategoryItem>> GetCategoriesAsync(ServiceCategoryListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var categories = await repository.GetCategoriesAsync(query.PageNumber, query.PageSize, query.IncludeInactive, cancellationToken);
        return PagedResult<ServiceCategoryItem>.Create(categories.Items.Select(MapCategory), query.PageNumber, query.PageSize, categories.TotalCount);
    }

    public async Task<ServiceCategoryItem> CreateCategoryAsync(ServiceCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, null, cancellationToken)) throw Conflict("Slug danh mục đã tồn tại.");
        var category = new ServiceCategory(request.Name, slug, request.DisplayOrder);
        category.Update(request.Name, slug, request.Description, request.Icon, request.DisplayOrder);
        repository.Add(category);
        return await CommitAndMap(category, "Catalog.ServiceCategoryCreated", userId, ipAddress, cancellationToken);
    }

    public async Task<ServiceCategoryItem> UpdateCategoryAsync(int id, ServiceCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ.");
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, id, cancellationToken)) throw Conflict("Slug danh mục đã tồn tại.");
        category.Update(request.Name, slug, request.Description, request.Icon, request.DisplayOrder);
        return await CommitAndMap(category, "Catalog.ServiceCategoryUpdated", userId, ipAddress, cancellationToken);
    }

    public async Task DeleteCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetCategoryStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeleteCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ.");
        if (category.ServicePlans.Any()) throw Conflict("Không thể xóa vĩnh viễn danh mục khi vẫn còn gói dịch vụ. Hãy xóa các gói trước.");
        repository.Remove(category);
        await Commit("Catalog.ServiceCategoryHardDeleted", category.Id.ToString(), nameof(ServiceCategory), userId, ipAddress, cancellationToken);
    }

    public async Task<ServiceCategoryItem> SetCategoryStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ.");
        if (category.IsActive == isActive && category.IsDeleted == !isActive) return MapCategory(category);

        category.SetActive(isActive);
        var action = isActive ? "Catalog.ServiceCategoryRestored" : "Catalog.ServiceCategoryDeactivated";
        await Commit(action, category.Id.ToString(), nameof(ServiceCategory), userId, ipAddress, cancellationToken);
        return MapCategory(category);
    }

    public async Task<CategoryDisableImpact> GetCategoryDisableImpactAsync(int id, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(id, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ.");
        return new CategoryDisableImpact(
            category.Id,
            category.Name,
            category.ServicePlans.Count(plan => plan.IsActive && !plan.IsDeleted),
            category.ServicePlans.Count(plan => !plan.IsDeleted));
    }

    public async Task<PagedResult<ServicePlanItem>> GetPlansAsync(ServicePlanListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var plans = await repository.GetPlansAsync(query.PageNumber, query.PageSize, query.Search, query.CategorySlug, query.IncludeInactive, cancellationToken);
        return PagedResult<ServicePlanItem>.Create(plans.Items.Select(MapAdminPlan), query.PageNumber, query.PageSize, plans.TotalCount);
    }

    public async Task<ServicePlanItem> CreatePlanAsync(ServicePlanRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await EnsureCategory(request.CategoryId, cancellationToken);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.PlanSlugExistsAsync(slug, null, cancellationToken)) throw Conflict("Slug gói dịch vụ đã tồn tại.");
        ValidateSpecifications(request.SpecificationsJson);
        var plan = new ServicePlan(request.CategoryId, request.Name, slug, request.DisplayOrder);
        plan.Update(request.CategoryId, request.Name, slug, request.ShortDescription, request.Description, request.CpuCores, request.RamGb, request.StorageGb, request.StorageType, request.BandwidthGb, request.SpecificationsJson, request.IsFeatured, request.DisplayOrder);
        repository.Add(plan);
        return await CommitAndMap(plan, "Catalog.ServicePlanCreated", userId, ipAddress, cancellationToken);
    }

    public async Task<ServicePlanItem> UpdatePlanAsync(int id, ServicePlanRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        await EnsureCategory(request.CategoryId, cancellationToken);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.PlanSlugExistsAsync(slug, id, cancellationToken)) throw Conflict("Slug gói dịch vụ đã tồn tại.");
        ValidateSpecifications(request.SpecificationsJson);
        plan.Update(request.CategoryId, request.Name, slug, request.ShortDescription, request.Description, request.CpuCores, request.RamGb, request.StorageGb, request.StorageType, request.BandwidthGb, request.SpecificationsJson, request.IsFeatured, request.DisplayOrder);
        return await CommitAndMap(plan, "Catalog.ServicePlanUpdated", userId, ipAddress, cancellationToken);
    }

    public async Task DeletePlanAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetPlanStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeletePlanAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        if (plan.Prices.Any() || plan.OrderRequests.Any()) throw Conflict("Không thể xóa vĩnh viễn gói dịch vụ đã có mức giá hoặc đơn hàng.");
        repository.Remove(plan);
        await Commit("Catalog.ServicePlanHardDeleted", plan.Id.ToString(), nameof(ServicePlan), userId, ipAddress, cancellationToken);
    }

    public async Task<ServicePlanItem> SetPlanStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        if (isActive && plan.Category is not { IsActive: true, IsDeleted: false }) throw Conflict("Hãy khôi phục danh mục cha trước khi khôi phục gói dịch vụ.");
        if (plan.IsActive == isActive && plan.IsDeleted == !isActive) return MapAdminPlan(plan);

        plan.SetActive(isActive);
        var action = isActive ? "Catalog.ServicePlanRestored" : "Catalog.ServicePlanDeactivated";
        await Commit(action, plan.Id.ToString(), nameof(ServicePlan), userId, ipAddress, cancellationToken);
        return MapAdminPlan(plan);
    }

    public async Task<PlanPriceItem> CreatePriceAsync(int servicePlanId, PlanPriceRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await EnsurePlan(servicePlanId, cancellationToken);
        ValidatePrice(request);
        if (await repository.ActivePricePeriodOverlapsAsync(servicePlanId, request.BillingCycle, request.EffectiveFrom, request.EffectiveTo, null, cancellationToken))
            throw Conflict("Khoảng hiệu lực bị chồng lấn với một mức giá đang hoạt động cùng chu kỳ.");
        var price = new PlanPrice(servicePlanId, request.BillingCycle, request.OriginalPrice, request.SalePrice);
        price.Update(request.BillingCycle, request.OriginalPrice, request.SalePrice, request.Currency, request.EffectiveFrom, request.EffectiveTo);
        repository.Add(price);
        await Commit("Catalog.PlanPriceCreated", price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
        return MapPrice(price);
    }

    public async Task<PlanPriceItem> UpdatePriceAsync(int id, PlanPriceRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var price = await repository.GetPriceAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bảng giá.");
        ValidatePrice(request);
        repository.SetOriginalRowVersion(price, DecodeRowVersion(request.RowVersion));
        if (price.IsActive && await repository.ActivePricePeriodOverlapsAsync(price.ServicePlanId, request.BillingCycle, request.EffectiveFrom, request.EffectiveTo, id, cancellationToken))
            throw Conflict("Khoảng hiệu lực bị chồng lấn với một mức giá đang hoạt động cùng chu kỳ.");
        price.Update(request.BillingCycle, request.OriginalPrice, request.SalePrice, request.Currency, request.EffectiveFrom, request.EffectiveTo);
        await Commit("Catalog.PlanPriceUpdated", price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
        return MapPrice(price);
    }

    public async Task DeletePriceAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetPriceStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeletePriceAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var price = await repository.GetPriceAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy mức giá.");
        repository.Remove(price);
        await Commit("Catalog.PlanPriceHardDeleted", price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
    }

    public async Task<PlanPriceItem> SetPriceStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var price = await repository.GetPriceAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bảng giá.");
        if (isActive && price.ServicePlan is not { IsActive: true, IsDeleted: false, Category.IsActive: true, Category.IsDeleted: false }) throw Conflict("Hãy khôi phục danh mục và gói dịch vụ trước khi khôi phục mức giá.");
        if (isActive && await repository.ActivePricePeriodOverlapsAsync(price.ServicePlanId, price.BillingCycle, price.EffectiveFrom, price.EffectiveTo, id, cancellationToken))
            throw Conflict("Không thể khôi phục vì khoảng hiệu lực đang chồng lấn với một mức giá hoạt động.");
        if (price.IsActive == isActive && price.IsDeleted == !isActive) return MapPrice(price);

        price.SetActive(isActive);
        var action = isActive ? "Catalog.PlanPriceRestored" : "Catalog.PlanPriceDeactivated";
        await Commit(action, price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
        return MapPrice(price);
    }

    public async Task<IReadOnlyCollection<PromotionItem>> GetPromotionsAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        var promotions = await repository.GetPromotionsAsync(includeInactive, cancellationToken);
        return promotions.Select(MapPromotion).ToArray();
    }

    public async Task<PromotionItem> CreatePromotionAsync(PromotionRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        ValidatePromotion(request);
        var code = request.Code.Trim().ToUpperInvariant();
        if (await repository.PromotionCodeExistsAsync(code, null, cancellationToken)) throw Conflict("Mã khuyến mãi đã tồn tại.");
        await EnsurePlans(request.ServicePlanIds, cancellationToken);
        var promotion = new Promotion(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt, request.MaxDiscountAmount, request.MinOrderValue);
        promotion.Update(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt, request.UsageLimit, request.Description, request.MaxDiscountAmount, request.MinOrderValue);
        repository.Add(promotion);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        repository.ReplacePromotionPlans(promotion, request.ServicePlanIds);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPromotion(promotion);
    }

    public async Task<PromotionItem> UpdatePromotionAsync(int id, PromotionRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        ValidatePromotion(request);
        var promotion = await repository.GetPromotionAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy khuyến mãi.");
        repository.SetOriginalRowVersion(promotion, DecodeRowVersion(request.RowVersion));
        var code = request.Code.Trim().ToUpperInvariant();
        if (await repository.PromotionCodeExistsAsync(code, id, cancellationToken)) throw Conflict("Mã khuyến mãi đã tồn tại.");
        await EnsurePlans(request.ServicePlanIds, cancellationToken);
        promotion.Update(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt, request.UsageLimit, request.Description, request.MaxDiscountAmount, request.MinOrderValue);
        repository.ReplacePromotionPlans(promotion, request.ServicePlanIds);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPromotion(promotion);
    }

    public async Task DeletePromotionAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await SetPromotionStatusAsync(id, false, userId, ipAddress, cancellationToken);
    }

    public async Task PermanentlyDeletePromotionAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var promotion = await repository.GetPromotionAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy khuyến mãi.");
        repository.Remove(promotion);
        await Commit("Catalog.PromotionHardDeleted", promotion.Id.ToString(), nameof(Promotion), userId, ipAddress, cancellationToken);
    }

    public async Task<PromotionItem> SetPromotionStatusAsync(int id, bool isActive, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var promotion = await repository.GetPromotionAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy khuyến mãi.");
        if (promotion.IsActive == isActive) return MapPromotion(promotion);

        promotion.SetActive(isActive);
        var action = isActive ? "Catalog.PromotionRestored" : "Catalog.PromotionDeactivated";
        await Commit(action, promotion.Id.ToString(), nameof(Promotion), userId, ipAddress, cancellationToken);
        return MapPromotion(promotion);
    }

    public async Task<QrCodeResult> GenerateQrAsync(int servicePlanId, string publicBaseUrl, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(servicePlanId, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        if (plan.IsDeleted || !plan.IsActive || plan.Category is not { IsActive: true, IsDeleted: false })
            throw new ConflictException("Chỉ có thể tạo QR cho gói và danh mục đang hoạt động.");
        var baseUrl = publicBaseUrl.TrimEnd('/');
        var targetUrl = $"{baseUrl}/order?planId={plan.Id}";
        var generatedAt = timeProvider.GetUtcNow().UtcDateTime;
        var dataUrl = qrCodeGenerator.CreateSvgDataUrl(targetUrl);
        var qrPath = $"/api/service-plans/{plan.Id}/qr-code";
        plan.SetQrCode(targetUrl, qrPath, generatedAt);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new QrCodeResult(plan.Id, targetUrl, dataUrl, generatedAt);
    }

    public async Task<string> GetPublicQrCodeAsync(int servicePlanId, string publicBaseUrl, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(servicePlanId, cancellationToken);
        if (plan is null || plan.IsDeleted || !plan.IsActive || plan.Category is null || plan.Category.IsDeleted || !plan.Category.IsActive) throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        var targetUrl = $"{publicBaseUrl.TrimEnd('/')}/order?planId={plan.Id}";
        return qrCodeGenerator.CreateSvgDataUrl(targetUrl);
    }

    public async Task<byte[]> GetPublicQrPngAsync(int servicePlanId, string publicBaseUrl, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(servicePlanId, cancellationToken);
        if (plan is null || plan.IsDeleted || !plan.IsActive || plan.Category is null || plan.Category.IsDeleted || !plan.Category.IsActive)
            throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        var targetUrl = $"{publicBaseUrl.TrimEnd('/')}/order?planId={plan.Id}";
        return qrCodeGenerator.CreatePng(targetUrl);
    }

    private async Task<ServiceCategoryItem> CommitAndMap(ServiceCategory entity, string action, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await unitOfWork.SaveChangesAsync(cancellationToken);
        unitOfWork.AddAuditLog(new AuditLog(action, userId, nameof(ServiceCategory), entity.Id.ToString(), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapCategory(entity);
    }

    private async Task<ServicePlanItem> CommitAndMap(ServicePlan entity, string action, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var savedPlan = await repository.GetPlanAsync(entity.Id, cancellationToken) ?? entity;
        return MapAdminPlan(savedPlan);
    }

    private async Task Commit(string action, string entityId, string entityName, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        if (entityName is not nameof(ServicePlan) and not nameof(PlanPrice) and not nameof(Promotion))
            unitOfWork.AddAuditLog(new AuditLog(action, userId, entityName, entityId, ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCategory(int id, CancellationToken cancellationToken)
    {
        if (id <= 0 || await repository.GetCategoryAsync(id, cancellationToken) is not { IsActive: true, IsDeleted: false }) throw new ResourceNotFoundException("Danh mục dịch vụ không tồn tại hoặc đã vô hiệu hóa.");
    }

    private async Task EnsurePlan(int id, CancellationToken cancellationToken)
    {
        if (id <= 0 || await repository.GetPlanAsync(id, cancellationToken) is not { IsActive: true, IsDeleted: false, Category.IsActive: true, Category.IsDeleted: false })
            throw new ResourceNotFoundException("Gói dịch vụ hoặc danh mục cha không tồn tại/đã vô hiệu hóa.");
    }

    private async Task EnsurePlans(IReadOnlyCollection<int> ids, CancellationToken cancellationToken)
    {
        if (ids.Any(id => id <= 0) || !await repository.PlansExistAsync(ids, cancellationToken)) throw new ResourceNotFoundException("Một hoặc nhiều gói áp dụng không tồn tại hoặc đã vô hiệu hóa.");
    }

    private static void ValidatePaging(int pageNumber, int pageSize)
    {
        if (pageNumber < 1 || pageSize is < 1 or > 100) throw new RequestValidationException("paging", "Trang phải >= 1 và pageSize nằm trong khoảng 1-100.");
    }

    private static void ValidatePrice(PlanPriceRequest request)
    {
        if (!Enum.IsDefined(request.BillingCycle)) throw new RequestValidationException(nameof(request.BillingCycle), "Chu kỳ thanh toán không hợp lệ.");
        if (request.SalePrice is < 0 || request.SalePrice > request.OriginalPrice) throw new RequestValidationException(nameof(request.SalePrice), "Giá bán phải nằm trong khoảng từ 0 đến giá gốc.");
        if (request.EffectiveFrom is not null && request.EffectiveTo is not null && request.EffectiveTo <= request.EffectiveFrom) throw new RequestValidationException(nameof(request.EffectiveTo), "Thời điểm kết thúc phải sau thời điểm bắt đầu.");
    }

    private static void ValidatePromotion(PromotionRequest request)
    {
        if (!Enum.IsDefined(request.DiscountType)) throw new RequestValidationException(nameof(request.DiscountType), "Loại giảm giá không hợp lệ.");
        if (request.EndAt <= request.StartAt) throw new RequestValidationException(nameof(request.EndAt), "Thời điểm kết thúc phải sau thời điểm bắt đầu.");
        if (request.DiscountValue <= 0 || (request.DiscountType == DiscountType.Percentage && request.DiscountValue > 100)) throw new RequestValidationException(nameof(request.DiscountValue), "Giá trị giảm giá không hợp lệ.");
        if (request.ServicePlanIds.Any(id => id <= 0)) throw new RequestValidationException(nameof(request.ServicePlanIds), "Danh sách gói áp dụng không hợp lệ.");
    }

    private static void ValidateSpecifications(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return;
        try { using var document = JsonDocument.Parse(json); if (document.RootElement.ValueKind != JsonValueKind.Object) throw new JsonException(); }
        catch (JsonException) { throw new RequestValidationException(nameof(ServicePlanRequest.SpecificationsJson), "Thông số kỹ thuật phải là JSON object hợp lệ."); }
    }

    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant();
    private static byte[] DecodeRowVersion(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new RequestValidationException("rowVersion", "Dữ liệu đã thiếu mã phiên bản. Hãy tải lại bản ghi trước khi lưu.");
        try
        {
            return Convert.FromBase64String(value);
        }
        catch (FormatException)
        {
            throw new RequestValidationException("rowVersion", "Mã phiên bản dữ liệu không hợp lệ.");
        }
    }
    private static ConflictException Conflict(string message) => new(message);

    private ServiceCategoryItem MapCategory(ServiceCategory category)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        return new ServiceCategoryItem(
        category.Id,
        category.Name,
        category.Slug,
        category.Description,
        category.Icon,
        category.DisplayOrder,
        category.IsActive,
        category.IsDeleted,
        category.ServicePlans.Count(plan => plan.IsActive && !plan.IsDeleted),
        category.ServicePlans.Count(plan => plan.IsActive && !plan.IsDeleted && plan.Prices.Any(price =>
            price.IsActive && !price.IsDeleted &&
            (price.EffectiveFrom == null || price.EffectiveFrom <= now) &&
            (price.EffectiveTo == null || price.EffectiveTo > now))),
        category.ServicePlans.Count(plan => !plan.IsDeleted));
    }
    internal static PlanPriceItem MapPrice(PlanPrice price) => new(price.Id, price.BillingCycle, price.OriginalPrice, price.SalePrice, price.SalePrice ?? price.OriginalPrice, price.Currency, price.EffectiveFrom, price.EffectiveTo, price.IsActive, price.IsDeleted, Convert.ToBase64String(price.RowVersion));
    private ServicePlanItem MapPublicPlan(ServicePlan plan)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        return MapPlan(plan, price =>
            price.IsActive &&
            !price.IsDeleted &&
            (price.EffectiveFrom is null || price.EffectiveFrom <= now) &&
            (price.EffectiveTo is null || price.EffectiveTo > now));
    }

    internal static ServicePlanItem MapAdminPlan(ServicePlan plan) => MapPlan(plan, _ => true);

    private static ServicePlanItem MapPlan(ServicePlan plan, Func<PlanPrice, bool> priceFilter) => new(
        plan.Id,
        plan.CategoryId,
        plan.Category?.Name ?? string.Empty,
        plan.Category?.Slug ?? string.Empty,
        plan.Name,
        plan.Slug,
        plan.ShortDescription,
        plan.Description,
        plan.CpuCores,
        plan.RamGb,
        plan.StorageGb,
        plan.StorageType,
        plan.BandwidthGb,
        plan.SpecificationsJson,
        plan.QrTargetUrl,
        plan.QrCodePath,
        plan.QrGeneratedAt,
        plan.IsFeatured,
        plan.DisplayOrder,
        plan.IsActive,
        plan.IsDeleted,
        plan.Prices.Where(priceFilter).OrderBy(price => price.BillingCycle).ThenByDescending(price => price.EffectiveFrom).Select(MapPrice).ToArray());
    internal static PromotionItem MapPromotion(Promotion promotion) => new(promotion.Id, promotion.Code, promotion.Name, promotion.Description, promotion.DiscountType, promotion.DiscountValue, promotion.StartAt, promotion.EndAt, promotion.UsageLimit, promotion.UsedCount, promotion.IsActive, promotion.PromotionServicePlans.Select(item => item.ServicePlanId).ToArray(), promotion.MaxDiscountAmount, promotion.MinOrderValue, Convert.ToBase64String(promotion.RowVersion));
}
