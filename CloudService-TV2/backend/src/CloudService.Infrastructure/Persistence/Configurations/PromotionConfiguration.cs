using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> builder)
    {
        builder.ToTable("Promotions", table =>
        {
            table.HasCheckConstraint("CK_Promotions_DiscountType", "[DiscountType] IN ('Percentage', 'FixedAmount')");
            table.HasCheckConstraint("CK_Promotions_DiscountValue", "[DiscountValue] > 0");
            table.HasCheckConstraint("CK_Promotions_Percentage", "[DiscountType] <> 'Percentage' OR [DiscountValue] <= 100");
            table.HasCheckConstraint("CK_Promotions_DateRange", "[EndAt] > [StartAt]");
            table.HasCheckConstraint("CK_Promotions_Usage", "[UsedCount] >= 0 AND ([UsageLimit] IS NULL OR ([UsageLimit] > 0 AND [UsedCount] <= [UsageLimit]))");
        });
        builder.HasKey(x => x.Id).HasName("PK_Promotions");
        builder.Property(x => x.Code).HasColumnType("varchar(50)").IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.DiscountType).HasConversion<string>().HasColumnType("varchar(20)");
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.StartAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.EndAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.UsedCount).HasDefaultValue(0);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => x.Code).IsUnique().HasDatabaseName("UQ_Promotions_Code");
    }
}
