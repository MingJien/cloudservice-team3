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
        return PagedResult<ServicePlanItem>.Create(plans.Items.Select(MapPlan), query.PageNumber, query.PageSize, plans.TotalCount);
    }

    public async Task<IReadOnlyCollection<ServicePlanItem>> GetFeaturedPlansAsync(CancellationToken cancellationToken)
    {
        var plans = await repository.GetFeaturedPlansAsync(cancellationToken);
        return plans.Select(MapPlan).ToArray();
    }

    public async Task<ServicePlanItem> GetPublicPlanAsync(string slug, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanBySlugAsync(slug.Trim().ToLowerInvariant(), false, cancellationToken)
            ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        return MapPlan(plan);
    }

    public async Task<ServicePlanItem> GetPublicPlanByIdAsync(int id, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(id, cancellationToken);
        if (plan is null || !plan.IsActive || plan.Category is null || !plan.Category.IsActive) throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        return MapPlan(plan);
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
        var category = await repository.GetCategoryAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy danh mục dịch vụ.");
        if (category.ServicePlans.Any(plan => plan.IsActive)) throw Conflict("Không thể vô hiệu hóa danh mục còn gói dịch vụ đang hoạt động.");
        repository.Remove(category);
        await Commit("Catalog.ServiceCategoryDeactivated", category.Id.ToString(), nameof(ServiceCategory), userId, ipAddress, cancellationToken);
    }

    public async Task<PagedResult<ServicePlanItem>> GetPlansAsync(ServicePlanListQuery query, CancellationToken cancellationToken)
    {
        ValidatePaging(query.PageNumber, query.PageSize);
        var plans = await repository.GetPlansAsync(query.PageNumber, query.PageSize, query.Search, query.CategorySlug, query.IncludeInactive, cancellationToken);
        return PagedResult<ServicePlanItem>.Create(plans.Items.Select(MapPlan), query.PageNumber, query.PageSize, plans.TotalCount);
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
        var plan = await repository.GetPlanAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        repository.Remove(plan);
        await Commit("Catalog.ServicePlanDeactivated", plan.Id.ToString(), nameof(ServicePlan), userId, ipAddress, cancellationToken);
    }

    public async Task<PlanPriceItem> CreatePriceAsync(int servicePlanId, PlanPriceRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        await EnsurePlan(servicePlanId, cancellationToken);
        ValidatePrice(request);
        if (await repository.PriceExistsAsync(servicePlanId, request.BillingCycle, request.EffectiveFrom, null, cancellationToken)) throw Conflict("Chu kỳ và thời điểm hiệu lực đã có giá.");
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
        if (await repository.PriceExistsAsync(price.ServicePlanId, request.BillingCycle, request.EffectiveFrom, id, cancellationToken)) throw Conflict("Chu kỳ và thời điểm hiệu lực đã có giá.");
        price.Update(request.BillingCycle, request.OriginalPrice, request.SalePrice, request.Currency, request.EffectiveFrom, request.EffectiveTo);
        await Commit("Catalog.PlanPriceUpdated", price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
        return MapPrice(price);
    }

    public async Task DeletePriceAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var price = await repository.GetPriceAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy bảng giá.");
        repository.Remove(price);
        await Commit("Catalog.PlanPriceDeactivated", price.Id.ToString(), nameof(PlanPrice), userId, ipAddress, cancellationToken);
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
        var promotion = new Promotion(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt);
        promotion.Update(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt, request.UsageLimit, request.Description);
        repository.Add(promotion);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        repository.ReplacePromotionPlans(promotion, request.ServicePlanIds);
        unitOfWork.AddAuditLog(new AuditLog("Catalog.PromotionCreated", userId, nameof(Promotion), promotion.Id.ToString(), newValues: JsonSerializer.Serialize(request), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPromotion(promotion);
    }

    public async Task<PromotionItem> UpdatePromotionAsync(int id, PromotionRequest request, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        ValidatePromotion(request);
        var promotion = await repository.GetPromotionAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy khuyến mãi.");
        var code = request.Code.Trim().ToUpperInvariant();
        if (await repository.PromotionCodeExistsAsync(code, id, cancellationToken)) throw Conflict("Mã khuyến mãi đã tồn tại.");
        await EnsurePlans(request.ServicePlanIds, cancellationToken);
        promotion.Update(code, request.Name, request.DiscountType, request.DiscountValue, request.StartAt, request.EndAt, request.UsageLimit, request.Description);
        repository.ReplacePromotionPlans(promotion, request.ServicePlanIds);
        unitOfWork.AddAuditLog(new AuditLog("Catalog.PromotionUpdated", userId, nameof(Promotion), promotion.Id.ToString(), newValues: JsonSerializer.Serialize(request), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPromotion(promotion);
    }

    public async Task DeletePromotionAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var promotion = await repository.GetPromotionAsync(id, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy khuyến mãi.");
        repository.Remove(promotion);
        await Commit("Catalog.PromotionDeactivated", promotion.Id.ToString(), nameof(Promotion), userId, ipAddress, cancellationToken);
    }

    public async Task<QrCodeResult> GenerateQrAsync(int servicePlanId, string publicBaseUrl, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(servicePlanId, cancellationToken) ?? throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        var baseUrl = publicBaseUrl.TrimEnd('/');
        var targetUrl = $"{baseUrl}/services/{plan.Slug}";
        var generatedAt = timeProvider.GetUtcNow().UtcDateTime;
        var dataUrl = qrCodeGenerator.CreateSvgDataUrl(targetUrl);
        var qrPath = $"/api/service-plans/{plan.Id}/qr-code";
        plan.SetQrCode(targetUrl, qrPath, generatedAt);
        unitOfWork.AddAuditLog(new AuditLog("Catalog.ServicePlanQrGenerated", userId, nameof(ServicePlan), plan.Id.ToString(), newValues: JsonSerializer.Serialize(new { targetUrl }), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return new QrCodeResult(plan.Id, targetUrl, dataUrl, generatedAt);
    }

    public async Task<string> GetPublicQrCodeAsync(int servicePlanId, string publicBaseUrl, CancellationToken cancellationToken)
    {
        var plan = await repository.GetPlanAsync(servicePlanId, cancellationToken);
        if (plan is null || !plan.IsActive || plan.Category is null || !plan.Category.IsActive) throw new ResourceNotFoundException("Không tìm thấy gói dịch vụ.");
        var targetUrl = $"{publicBaseUrl.TrimEnd('/')}/services/{plan.Slug}";
        return qrCodeGenerator.CreateSvgDataUrl(targetUrl);
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
        unitOfWork.AddAuditLog(new AuditLog(action, userId, nameof(ServicePlan), entity.Id.ToString(), ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var savedPlan = await repository.GetPlanAsync(entity.Id, cancellationToken) ?? entity;
        return MapPlan(savedPlan);
    }

    private async Task Commit(string action, string entityId, string entityName, int userId, string? ipAddress, CancellationToken cancellationToken)
    {
        unitOfWork.AddAuditLog(new AuditLog(action, userId, entityName, entityId, ipAddress: ipAddress));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureCategory(int id, CancellationToken cancellationToken)
    {
        if (id <= 0 || await repository.GetCategoryAsync(id, cancellationToken) is not { IsActive: true }) throw new ResourceNotFoundException("Danh mục dịch vụ không tồn tại hoặc đã vô hiệu hóa.");
    }

    private async Task EnsurePlan(int id, CancellationToken cancellationToken)
    {
        if (id <= 0 || await repository.GetPlanAsync(id, cancellationToken) is not { IsActive: true }) throw new ResourceNotFoundException("Gói dịch vụ không tồn tại hoặc đã vô hiệu hóa.");
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
    private static ConflictException Conflict(string message) => new(message);

    internal static ServiceCategoryItem MapCategory(ServiceCategory category) => new(category.Id, category.Name, category.Slug, category.Description, category.Icon, category.DisplayOrder, category.IsActive);
    internal static PlanPriceItem MapPrice(PlanPrice price) => new(price.Id, price.BillingCycle, price.OriginalPrice, price.SalePrice, price.SalePrice ?? price.OriginalPrice, price.Currency, price.EffectiveFrom, price.EffectiveTo, price.IsActive);
    internal static ServicePlanItem MapPlan(ServicePlan plan) => new(plan.Id, plan.CategoryId, plan.Category?.Name ?? string.Empty, plan.Category?.Slug ?? string.Empty, plan.Name, plan.Slug, plan.ShortDescription, plan.Description, plan.CpuCores, plan.RamGb, plan.StorageGb, plan.StorageType, plan.BandwidthGb, plan.SpecificationsJson, plan.QrTargetUrl, plan.QrCodePath, plan.QrGeneratedAt, plan.IsFeatured, plan.DisplayOrder, plan.IsActive, plan.Prices.Where(price => price.IsActive).OrderBy(price => price.BillingCycle).Select(MapPrice).ToArray());
    internal static PromotionItem MapPromotion(Promotion promotion) => new(promotion.Id, promotion.Code, promotion.Name, promotion.Description, promotion.DiscountType, promotion.DiscountValue, promotion.StartAt, promotion.EndAt, promotion.UsageLimit, promotion.UsedCount, promotion.IsActive, promotion.PromotionServicePlans.Select(item => item.ServicePlanId).ToArray());
}
