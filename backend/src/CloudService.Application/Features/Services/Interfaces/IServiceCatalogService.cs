using CloudService.Application.Common.Models;
using CloudService.Application.Features.Services.Models;

namespace CloudService.Application.Features.Services.Interfaces;

public interface IServiceCatalogService
{
    Task<IReadOnlyCollection<ServiceCategoryItem>> GetPublicCategoriesAsync(CancellationToken cancellationToken);
    Task<PagedResult<ServicePlanItem>> GetPublicPlansAsync(ServicePlanListQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ServicePlanItem>> GetFeaturedPlansAsync(CancellationToken cancellationToken);
    Task<ServicePlanItem> GetPublicPlanAsync(string slug, CancellationToken cancellationToken);
    Task<ServicePlanItem> GetPublicPlanByIdAsync(int id, CancellationToken cancellationToken);
    Task<PagedResult<ServiceCategoryItem>> GetCategoriesAsync(ServiceCategoryListQuery query, CancellationToken cancellationToken);
    Task<ServiceCategoryItem> CreateCategoryAsync(ServiceCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<ServiceCategoryItem> UpdateCategoryAsync(int id, ServiceCategoryRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeleteCategoryAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<ServicePlanItem>> GetPlansAsync(ServicePlanListQuery query, CancellationToken cancellationToken);
    Task<ServicePlanItem> CreatePlanAsync(ServicePlanRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<ServicePlanItem> UpdatePlanAsync(int id, ServicePlanRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeletePlanAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PlanPriceItem> CreatePriceAsync(int servicePlanId, PlanPriceRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PlanPriceItem> UpdatePriceAsync(int id, PlanPriceRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeletePriceAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PromotionItem>> GetPromotionsAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<PromotionItem> CreatePromotionAsync(PromotionRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<PromotionItem> UpdatePromotionAsync(int id, PromotionRequest request, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task DeletePromotionAsync(int id, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<QrCodeResult> GenerateQrAsync(int servicePlanId, string publicBaseUrl, int userId, string? ipAddress, CancellationToken cancellationToken);
    Task<string> GetPublicQrCodeAsync(int servicePlanId, string publicBaseUrl, CancellationToken cancellationToken);
}
