using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AffiliateAttributionConfiguration : IEntityTypeConfiguration<AffiliateAttribution>
{
    public void Configure(EntityTypeBuilder<AffiliateAttribution> builder)
    {
        builder.ToTable("AffiliateAttributions", table =>
        {
            table.HasCheckConstraint("CK_AffiliateAttributions_CommissionRate", "[CommissionRateSnapshot] >= 0 AND [CommissionRateSnapshot] <= 100");
            table.HasCheckConstraint("CK_AffiliateAttributions_Amounts", "[RevenueSnapshot] >= 0 AND [CommissionAmount] >= 0");
            table.HasCheckConstraint("CK_AffiliateAttributions_Status", "[Status] IN ('Pending', 'Eligible', 'Rejected', 'Paid')");
        });
        builder.HasKey(item => item.Id).HasName("PK_AffiliateAttributions");
        builder.Property(item => item.AffiliateCodeSnapshot).HasColumnType("varchar(50)").IsRequired();
        builder.Property(item => item.CommissionRateSnapshot).HasPrecision(5, 2);
        builder.Property(item => item.RevenueSnapshot).HasPrecision(18, 2);
        builder.Property(item => item.CommissionAmount).HasPrecision(18, 2);
        builder.Property(item => item.Status).HasConversion<string>().HasColumnType("varchar(20)").HasDefaultValue(AffiliateCommissionStatus.Pending).HasSentinel((AffiliateCommissionStatus)(-1));
        builder.Property(item => item.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(item => item.UpdatedAt).HasColumnType("datetime2(0)");
        builder.Property(item => item.EligibleAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.PaidAtUtc).HasColumnType("datetime2(0)");
        builder.HasIndex(item => item.OrderRequestId).IsUnique().HasDatabaseName("UQ_AffiliateAttributions_OrderRequestId");
        builder.HasIndex(item => new { item.AffiliatePartnerId, item.Status, item.CreatedAt }).IsDescending(false, false, true).HasDatabaseName("IX_AffiliateAttributions_Partner_Status_CreatedAt");
        builder.HasOne(item => item.AffiliatePartner).WithMany(item => item.Attributions).HasForeignKey(item => item.AffiliatePartnerId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_AffiliateAttributions_AffiliatePartners");
        builder.HasOne(item => item.OrderRequest).WithOne(item => item.AffiliateAttribution).HasForeignKey<AffiliateAttribution>(item => item.OrderRequestId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_AffiliateAttributions_OrderRequests");
    }
}
