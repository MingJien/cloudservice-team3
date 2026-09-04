using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AffiliateApplicationConfiguration : IEntityTypeConfiguration<AffiliateApplication>
{
    public void Configure(EntityTypeBuilder<AffiliateApplication> builder)
    {
        builder.ToTable("AffiliateApplications", table => table.HasCheckConstraint("CK_AffiliateApplications_Status", "[Status] IN ('New', 'Processing', 'Done', 'Rejected')"));
        builder.HasKey(x => x.Id).HasName("PK_AffiliateApplications");
        builder.Property(x => x.TrackingCode).HasColumnType("varchar(40)").IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Phone).HasColumnType("varchar(20)").IsRequired();
        builder.Property(x => x.WebsiteOrChannel).HasMaxLength(500);
        builder.Property(x => x.Note).HasMaxLength(2000);
        builder.Property(x => x.InternalNote).HasMaxLength(2000);
        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasColumnType("varchar(20)")
            .HasDefaultValue(AffiliateApplicationStatus.New)
            .HasSentinel((AffiliateApplicationStatus)(-1));
        builder.Property(x => x.IsDeleted).HasDefaultValue(false);
        builder.Property(x => x.DeletedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(x => x.RowVersion).IsRowVersion().IsConcurrencyToken();
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => new { x.Status, x.CreatedAt }).IsDescending(false, true).HasDatabaseName("IX_AffiliateApplications_Status_CreatedAt");
        builder.HasIndex(x => x.TrackingCode).IsUnique().HasDatabaseName("UX_AffiliateApplications_TrackingCode");
        builder.HasIndex(x => x.Email).IsUnique().HasFilter("[IsDeleted] = 0").HasDatabaseName("UQ_AffiliateApplications_Email");
        builder.HasIndex(x => x.Phone).IsUnique().HasFilter("[IsDeleted] = 0").HasDatabaseName("UQ_AffiliateApplications_Phone");
        builder.HasIndex(x => x.WebsiteOrChannel)
            .IsUnique()
            .HasFilter("[WebsiteOrChannel] IS NOT NULL AND [IsDeleted] = 0")
            .HasDatabaseName("UQ_AffiliateApplications_WebsiteOrChannel");
    }
}
