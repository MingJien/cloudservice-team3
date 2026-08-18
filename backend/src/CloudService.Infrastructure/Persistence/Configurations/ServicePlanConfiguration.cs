using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class ServicePlanConfiguration : IEntityTypeConfiguration<ServicePlan>
{
    public void Configure(EntityTypeBuilder<ServicePlan> builder)
    {
        builder.ToTable("ServicePlans", table =>
        {
            table.HasCheckConstraint("CK_ServicePlans_CpuCores", "[CpuCores] IS NULL OR [CpuCores] > 0");
            table.HasCheckConstraint("CK_ServicePlans_RamGb", "[RamGb] IS NULL OR [RamGb] > 0");
            table.HasCheckConstraint("CK_ServicePlans_StorageGb", "[StorageGb] IS NULL OR [StorageGb] > 0");
            table.HasCheckConstraint("CK_ServicePlans_BandwidthGb", "[BandwidthGb] IS NULL OR [BandwidthGb] > 0");
            table.HasCheckConstraint("CK_ServicePlans_DisplayOrder", "[DisplayOrder] >= 0");
            table.HasCheckConstraint("CK_ServicePlans_SpecificationsJson", "[SpecificationsJson] IS NULL OR ISJSON([SpecificationsJson]) = 1");
        });
        builder.HasKey(x => x.Id).HasName("PK_ServicePlans");
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Slug).HasColumnType("varchar(180)").IsRequired();
        builder.Property(x => x.ShortDescription).HasMaxLength(500);
        builder.Property(x => x.Description).HasColumnType("nvarchar(max)");
        builder.Property(x => x.RamGb).HasPrecision(8, 2);
        builder.Property(x => x.StorageType).HasMaxLength(30);
        builder.Property(x => x.SpecificationsJson).HasColumnType("nvarchar(max)");
        builder.Property(x => x.QrTargetUrl).HasMaxLength(500);
        builder.Property(x => x.QrCodePath).HasMaxLength(500);
        builder.Property(x => x.QrGeneratedAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.IsFeatured).HasDefaultValue(false);
        builder.Property(x => x.DisplayOrder).HasDefaultValue(0);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("UQ_ServicePlans_Slug");
        builder.HasIndex(x => new { x.CategoryId, x.IsActive }).HasDatabaseName("IX_ServicePlans_CategoryId_IsActive");
        builder.HasOne(x => x.Category).WithMany(x => x.ServicePlans).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_ServicePlans_ServiceCategories");
    }
}
