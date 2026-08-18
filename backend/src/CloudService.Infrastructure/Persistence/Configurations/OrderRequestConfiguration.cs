using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class OrderRequestConfiguration : IEntityTypeConfiguration<OrderRequest>
{
    public void Configure(EntityTypeBuilder<OrderRequest> builder)
    {
        builder.ToTable("OrderRequests", table =>
        {
            table.HasCheckConstraint("CK_OrderRequests_BillingCycle", "[BillingCycleSnapshot] IN ('Monthly', 'Quarterly', 'Yearly')");
            table.HasCheckConstraint("CK_OrderRequests_Status", "[Status] IN ('New', 'Processing', 'Done', 'Rejected')");
            table.HasCheckConstraint("CK_OrderRequests_Amounts", "[UnitPrice] >= 0 AND [DiscountAmount] >= 0 AND [EstimatedAmount] >= 0 AND [DiscountAmount] <= [UnitPrice]");
        });
        builder.HasKey(x => x.Id).HasName("PK_OrderRequests");
        builder.Property(x => x.TrackingCode).HasColumnType("varchar(30)").IsRequired();
        builder.Property(x => x.CustomerName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Phone).HasColumnType("varchar(20)").IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(200);
        builder.Property(x => x.PromotionCode).HasColumnType("varchar(50)");
        builder.Property(x => x.PlanNameSnapshot).HasMaxLength(150).IsRequired();
        builder.Property(x => x.BillingCycleSnapshot).HasConversion<string>().HasColumnType("varchar(20)");
        builder.Property(x => x.UnitPrice).HasPrecision(18, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(18, 2).HasDefaultValue(0m);
        builder.Property(x => x.EstimatedAmount).HasPrecision(18, 2);
        builder.Property(x => x.Note).HasMaxLength(2000);
        builder.Property(x => x.InternalNote).HasMaxLength(2000);
        builder.Property(x => x.Status).HasConversion<string>().HasColumnType("varchar(20)").HasDefaultValue(CloudService.Domain.Enums.OrderRequestStatus.New);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => x.TrackingCode).IsUnique().HasDatabaseName("UQ_OrderRequests_TrackingCode");
        builder.HasIndex(x => new { x.Status, x.CreatedAt }).IsDescending(false, true).HasDatabaseName("IX_OrderRequests_Status_CreatedAt");
        builder.HasIndex(x => x.ServicePlanId).HasDatabaseName("IX_OrderRequests_ServicePlanId");
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.OrderRequests).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_OrderRequests_ServicePlans");
        builder.HasOne(x => x.PlanPrice).WithMany(x => x.OrderRequests).HasForeignKey(x => x.PlanPriceId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_OrderRequests_PlanPrices");
    }
}
