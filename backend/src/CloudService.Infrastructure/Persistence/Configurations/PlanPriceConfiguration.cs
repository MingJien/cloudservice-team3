using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class PlanPriceConfiguration : IEntityTypeConfiguration<PlanPrice>
{
    public void Configure(EntityTypeBuilder<PlanPrice> builder)
    {
        builder.ToTable("PlanPrices", table =>
        {
            table.HasCheckConstraint("CK_PlanPrices_BillingCycle", "[BillingCycle] IN ('Monthly', 'Quarterly', 'Yearly')");
            table.HasCheckConstraint("CK_PlanPrices_OriginalPrice", "[OriginalPrice] >= 0");
            table.HasCheckConstraint("CK_PlanPrices_SalePrice", "[SalePrice] IS NULL OR ([SalePrice] >= 0 AND [SalePrice] <= [OriginalPrice])");
            table.HasCheckConstraint("CK_PlanPrices_EffectiveRange", "[EffectiveTo] IS NULL OR [EffectiveFrom] IS NULL OR [EffectiveTo] > [EffectiveFrom]");
        });
        builder.HasKey(x => x.Id).HasName("PK_PlanPrices");
        builder.Property(x => x.BillingCycle).HasConversion<string>().HasColumnType("varchar(20)");
        builder.Property(x => x.OriginalPrice).HasPrecision(18, 2);
        builder.Property(x => x.SalePrice).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasColumnType("char(3)").HasDefaultValue("VND");
        builder.Property(x => x.EffectiveFrom).HasColumnType("datetime2(0)");
        builder.Property(x => x.EffectiveTo).HasColumnType("datetime2(0)");
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => new { x.ServicePlanId, x.BillingCycle, x.EffectiveFrom }).IsUnique().HasDatabaseName("UQ_PlanPrices_Plan_Cycle_From");
        builder.HasIndex(x => new { x.ServicePlanId, x.IsActive }).HasDatabaseName("IX_PlanPrices_Plan_Active");
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.Prices).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_PlanPrices_ServicePlans");
    }
}
