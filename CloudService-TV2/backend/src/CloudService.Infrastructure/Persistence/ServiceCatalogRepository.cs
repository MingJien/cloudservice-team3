using CloudService.Application.Common.Models;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class ServiceCatalogRepository(ApplicationDbContext dbContext) : IServiceCatalogRepository
{
    public async Task<IReadOnlyCollection<ServiceCategory>> GetCategoriesAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        return await dbContext.ServiceCategories
            .AsNoTracking()
            .Where(category => includeInactive || category.IsActive)
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<PagedResult<ServiceCategory>> GetCategoriesAsync(int pageNumber, int pageSize, bool includeInactive, CancellationToken cancellationToken)
    {
        var query = dbContext.ServiceCategories
            .AsNoTracking()
            .Where(category => includeInactive || category.IsActive)
            .OrderBy(category => category.DisplayOrder)
            .ThenBy(category => category.Name);
        var total = await query.CountAsync(cancellationToken);
        var items = await query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<ServiceCategory>.Create(items, pageNumber, pageSize, total);
    }

    public Task<ServiceCategory?> GetCategoryAsync(int id, CancellationToken cancellationToken) =>
        dbContext.ServiceCategories.Include(category => category.ServicePlans).SingleOrDefaultAsync(category => category.Id == id, cancellationToken);

    public Task<bool> CategorySlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.ServiceCategories.AnyAsync(category => category.Slug == slug && (exceptId == null || category.Id != exceptId), cancellationToken);

    public async Task<PagedResult<ServicePlan>> GetPlansAsync(int pageNumber, int pageSize, string? search, string? categorySlug, bool includeInactive, CancellationToken cancellationToken)
    {
        var normalizedSearch = search?.Trim().ToUpperInvariant();
        var normalizedCategory = categorySlug?.Trim().ToLowerInvariant();
        var query = dbContext.ServicePlans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(plan => plan.Category)
            .Include(plan => plan.Prices)
            .Where(plan => (includeInactive || plan.IsActive) && (includeInactive || plan.Category.IsActive));
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
            query = query.Where(plan => plan.Name.ToUpper().Contains(normalizedSearch) || (plan.ShortDescription ?? string.Empty).ToUpper().Contains(normalizedSearch));
        if (!string.IsNullOrWhiteSpace(normalizedCategory))
            query = query.Where(plan => plan.Category.Slug == normalizedCategory);

        var ordered = query.OrderBy(plan => plan.DisplayOrder).ThenBy(plan => plan.Id);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToArrayAsync(cancellationToken);
        return PagedResult<ServicePlan>.Create(items, pageNumber, pageSize, total);
    }

    public async Task<IReadOnlyCollection<ServicePlan>> GetFeaturedPlansAsync(CancellationToken cancellationToken)
    {
        return await dbContext.ServicePlans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(plan => plan.Category)
            .Include(plan => plan.Prices)
            .Where(plan => plan.IsActive && plan.IsFeatured && plan.Category.IsActive)
            .OrderBy(plan => plan.DisplayOrder)
            .ThenBy(plan => plan.Id)
            .ToArrayAsync(cancellationToken);
    }

    public Task<ServicePlan?> GetPlanAsync(int id, CancellationToken cancellationToken) =>
        dbContext.ServicePlans
            .Include(plan => plan.Category)
            .Include(plan => plan.Prices)
            .SingleOrDefaultAsync(plan => plan.Id == id, cancellationToken);

    public Task<ServicePlan?> GetPlanBySlugAsync(string slug, bool includeInactive, CancellationToken cancellationToken) =>
        dbContext.ServicePlans
            .AsNoTracking()
            .AsSplitQuery()
            .Include(plan => plan.Category)
            .Include(plan => plan.Prices)
            .SingleOrDefaultAsync(plan => plan.Slug == slug && (includeInactive || (plan.IsActive && plan.Category.IsActive)), cancellationToken);

    public Task<bool> PlanSlugExistsAsync(string slug, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.ServicePlans.AnyAsync(plan => plan.Slug == slug && (exceptId == null || plan.Id != exceptId), cancellationToken);

    public Task<PlanPrice?> GetPriceAsync(int id, CancellationToken cancellationToken) =>
        dbContext.PlanPrices.Include(price => price.ServicePlan).SingleOrDefaultAsync(price => price.Id == id, cancellationToken);

    public Task<bool> PriceExistsAsync(int planId, BillingCycle billingCycle, DateTime? effectiveFrom, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.PlanPrices.AnyAsync(price =>
            price.ServicePlanId == planId && price.BillingCycle == billingCycle && price.EffectiveFrom == effectiveFrom &&
            (exceptId == null || price.Id != exceptId), cancellationToken);

    public Task<Promotion?> GetPromotionAsync(int id, CancellationToken cancellationToken) =>
        dbContext.Promotions.Include(promotion => promotion.PromotionServicePlans)
            .SingleOrDefaultAsync(promotion => promotion.Id == id, cancellationToken);

    public Task<bool> PromotionCodeExistsAsync(string code, int? exceptId, CancellationToken cancellationToken) =>
        dbContext.Promotions.AnyAsync(promotion => promotion.Code == code && (exceptId == null || promotion.Id != exceptId), cancellationToken);

    public async Task<IReadOnlyCollection<Promotion>> GetPromotionsAsync(bool includeInactive, CancellationToken cancellationToken)
    {
        return await dbContext.Promotions
            .AsNoTracking()
            .Include(promotion => promotion.PromotionServicePlans)
            .Where(promotion => includeInactive || promotion.IsActive)
            .OrderByDescending(promotion => promotion.StartAt)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<bool> PlansExistAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken)
    {
        var distinctIds = ids.Distinct().ToArray();
        var count = await dbContext.ServicePlans.CountAsync(plan => distinctIds.Contains(plan.Id) && plan.IsActive, cancellationToken);
        return count == distinctIds.Length;
    }

    public void Add(ServiceCategory category) => dbContext.ServiceCategories.Add(category);
    public void Add(ServicePlan plan) => dbContext.ServicePlans.Add(plan);
    public void Add(PlanPrice price) => dbContext.PlanPrices.Add(price);
    public void Add(Promotion promotion) => dbContext.Promotions.Add(promotion);
    public void Remove(ServiceCategory category) => category.SetActive(false);
    public void Remove(ServicePlan plan) => plan.SetActive(false);
    public void Remove(PlanPrice price) => price.SetActive(false);
    public void Remove(Promotion promotion) => promotion.SetActive(false);

    public void ReplacePromotionPlans(Promotion promotion, IReadOnlyCollection<int> servicePlanIds)
    {
        dbContext.PromotionServicePlans.RemoveRange(promotion.PromotionServicePlans);
        foreach (var servicePlanId in servicePlanIds.Distinct())
            dbContext.PromotionServicePlans.Add(new PromotionServicePlan(promotion.Id, servicePlanId));
    }
}
