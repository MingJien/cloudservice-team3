using CloudService.Application.Common.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Services.Interfaces;

public interface IServiceCatalogRepository
{
    Task<IReadOnlyCollection<ServiceCategory>> GetCategoriesAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<PagedResult<ServiceCategory>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken);
    Task<ServiceCategory?> GetCategoryAsync(int id, CancellationToken cancellationToken);
    Task<bool> CategorySlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken);
    Task<PagedResult<ServicePlan>> GetPlansAsync(int pageNumber, int pageSize, string? search, string? categorySlug, bool includeInactive, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<ServicePlan>> GetFeaturedPlansAsync(CancellationToken cancellationToken);
    Task<ServicePlan?> GetPlanAsync(int id, CancellationToken cancellationToken);
    Task<ServicePlan?> GetPlanBySlugAsync(string slug, bool includeInactive, CancellationToken cancellationToken);
    Task<bool> PlanSlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken);
    Task<PlanPrice?> GetPriceAsync(int id, CancellationToken cancellationToken);
    Task<bool> PriceExistsAsync(int planId, BillingCycle billingCycle, DateTime? effectiveFrom, int? exceptId, CancellationToken cancellationToken);
    Task<Promotion?> GetPromotionAsync(int id, CancellationToken cancellationToken);
    Task<bool> PromotionCodeExistsAsync(string code, int? exceptId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<Promotion>> GetPromotionsAsync(bool includeInactive, CancellationToken cancellationToken);
    Task<bool> PlansExistAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken);
    void Add(ServiceCategory category);
    void Add(ServicePlan plan);
    void Add(PlanPrice price);
    void Add(Promotion promotion);
    void Remove(ServiceCategory category);
    void Remove(ServicePlan plan);
    void Remove(PlanPrice price);
    void Remove(Promotion promotion);
    void ReplacePromotionPlans(Promotion promotion, IReadOnlyCollection<int> servicePlanIds);
}
