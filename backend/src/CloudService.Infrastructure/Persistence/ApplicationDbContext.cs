using System.Linq.Expressions;
using CloudService.Domain.Common;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServicePlan> ServicePlans => Set<ServicePlan>();
    public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<PromotionServicePlan> PromotionServicePlans => Set<PromotionServicePlan>();
    public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();
    public DbSet<AffiliateApplication> AffiliateApplications => Set<AffiliateApplication>();
    public DbSet<AffiliatePartner> AffiliatePartners => Set<AffiliatePartner>();
    public DbSet<AffiliateReferral> AffiliateReferrals => Set<AffiliateReferral>();
    public DbSet<AffiliateAttribution> AffiliateAttributions => Set<AffiliateAttribution>();
    public DbSet<ApiIdempotencyRecord> ApiIdempotencyRecords => Set<ApiIdempotencyRecord>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<NewsCategory> NewsCategories => Set<NewsCategory>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<SiteBranding> SiteBranding => Set<SiteBranding>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        ApplicationDataSeed.Apply(modelBuilder);
        ApplySoftDeleteQueryFilters(modelBuilder);
        base.OnModelCreating(modelBuilder);
    }

    private static void ApplySoftDeleteQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes()
                     .Where(type => typeof(ISoftDelete).IsAssignableFrom(type.ClrType)))
        {
            var entity = Expression.Parameter(entityType.ClrType, "entity");
            var isDeleted = Expression.Property(entity, nameof(ISoftDelete.IsDeleted));
            var filter = Expression.Lambda(Expression.Not(isDeleted), entity);
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }
    }
}
