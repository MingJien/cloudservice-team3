using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AffiliatePayoutConfiguration : IEntityTypeConfiguration<AffiliatePayout>
{
    public void Configure(EntityTypeBuilder<AffiliatePayout> builder)
    {
        builder.ToTable("AffiliatePayouts", table =>
        {
            table.HasCheckConstraint("CK_AffiliatePayouts_Amount", "[Amount] >= 500000");
            table.HasCheckConstraint("CK_AffiliatePayouts_Status", "[Status] IN ('Requested', 'Processing', 'Paid', 'Rejected')");
        });
        builder.HasKey(item => item.Id).HasName("PK_AffiliatePayouts");
        builder.Property(item => item.RequestCode).HasColumnType("varchar(30)").IsRequired();
        builder.Property(item => item.Amount).HasPrecision(18, 2);
        builder.Property(item => item.BankName).HasMaxLength(100).IsRequired();
        builder.Property(item => item.BankAccountNumber).HasColumnType("varchar(32)").IsRequired();
        builder.Property(item => item.BankAccountName).HasMaxLength(150).IsRequired();
        builder.Property(item => item.Status).HasConversion<string>().HasColumnType("varchar(20)").HasDefaultValue(AffiliatePayoutStatus.Requested).HasSentinel((AffiliatePayoutStatus)(-1));
        builder.Property(item => item.ReviewNote).HasMaxLength(1000);
        builder.Property(item => item.RequestedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.ReviewedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.PaidAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(item => item.UpdatedAt).HasColumnType("datetime2(0)");
        builder.Property(item => item.RowVersion).IsRowVersion().IsConcurrencyToken();
        builder.HasIndex(item => item.RequestCode).IsUnique().HasDatabaseName("UQ_AffiliatePayouts_RequestCode");
        builder.HasIndex(item => new { item.AffiliatePartnerId, item.Status, item.RequestedAtUtc }).IsDescending(false, false, true).HasDatabaseName("IX_AffiliatePayouts_Partner_Status_RequestedAt");
        builder.HasOne(item => item.AffiliatePartner).WithMany(item => item.Payouts).HasForeignKey(item => item.AffiliatePartnerId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_AffiliatePayouts_AffiliatePartners");
    }
}
