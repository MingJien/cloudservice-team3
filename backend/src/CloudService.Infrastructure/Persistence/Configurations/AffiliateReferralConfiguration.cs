using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AffiliateReferralConfiguration : IEntityTypeConfiguration<AffiliateReferral>
{
    public void Configure(EntityTypeBuilder<AffiliateReferral> builder)
    {
        builder.ToTable("AffiliateReferrals");
        builder.HasKey(item => item.Id).HasName("PK_AffiliateReferrals");
        builder.Property(item => item.VisitId).IsRequired();
        builder.Property(item => item.LandingPath).HasMaxLength(500);
        builder.Property(item => item.Referrer).HasMaxLength(500);
        builder.Property(item => item.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(item => item.UpdatedAt).HasColumnType("datetime2(0)");
        builder.Property(item => item.ExpiresAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.ConvertedAtUtc).HasColumnType("datetime2(0)");
        builder.HasIndex(item => item.VisitId).IsUnique().HasDatabaseName("UQ_AffiliateReferrals_VisitId");
        builder.HasIndex(item => new { item.AffiliatePartnerId, item.CreatedAt }).IsDescending(false, true).HasDatabaseName("IX_AffiliateReferrals_Partner_CreatedAt");
        builder.HasOne(item => item.AffiliatePartner).WithMany(item => item.Referrals).HasForeignKey(item => item.AffiliatePartnerId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_AffiliateReferrals_AffiliatePartners");
        builder.HasOne(item => item.OrderRequest).WithOne(item => item.AffiliateReferral).HasForeignKey<AffiliateReferral>(item => item.OrderRequestId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_AffiliateReferrals_OrderRequests");
    }
}
