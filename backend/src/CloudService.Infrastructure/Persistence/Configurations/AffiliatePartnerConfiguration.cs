using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AffiliatePartnerConfiguration : IEntityTypeConfiguration<AffiliatePartner>
{
    public void Configure(EntityTypeBuilder<AffiliatePartner> builder)
    {
        builder.ToTable("AffiliatePartners", table =>
            table.HasCheckConstraint("CK_AffiliatePartners_CommissionRate", "[CommissionRate] >= 0 AND [CommissionRate] <= 100"));
        builder.HasKey(item => item.Id).HasName("PK_AffiliatePartners");
        builder.Property(item => item.Code).HasColumnType("varchar(50)").IsRequired();
        builder.Property(item => item.DisplayName).HasMaxLength(150).IsRequired();
        builder.Property(item => item.CommissionRate).HasPrecision(5, 2);
        builder.Property(item => item.IsActive).HasDefaultValue(true);
        builder.Property(item => item.RowVersion).IsRowVersion().IsConcurrencyToken();
        builder.Property(item => item.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(item => item.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(item => item.Code).IsUnique().HasDatabaseName("UQ_AffiliatePartners_Code");
        builder.HasIndex(item => item.ApplicationId).IsUnique().HasDatabaseName("UQ_AffiliatePartners_ApplicationId");
        builder.HasOne(item => item.Application)
            .WithOne(item => item.Partner)
            .HasForeignKey<AffiliatePartner>(item => item.ApplicationId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_AffiliatePartners_AffiliateApplications");
    }
}
