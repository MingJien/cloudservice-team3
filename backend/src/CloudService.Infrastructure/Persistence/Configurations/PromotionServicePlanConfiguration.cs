using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class PromotionServicePlanConfiguration : IEntityTypeConfiguration<PromotionServicePlan>
{
    public void Configure(EntityTypeBuilder<PromotionServicePlan> builder)
    {
        builder.ToTable("PromotionServicePlans");
        builder.HasKey(x => new { x.PromotionId, x.ServicePlanId }).HasName("PK_PromotionServicePlans");
        builder.HasOne(x => x.Promotion).WithMany(x => x.PromotionServicePlans).HasForeignKey(x => x.PromotionId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_PromotionServicePlans_Promotions");
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.PromotionServicePlans).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_PromotionServicePlans_ServicePlans");
    }
}
