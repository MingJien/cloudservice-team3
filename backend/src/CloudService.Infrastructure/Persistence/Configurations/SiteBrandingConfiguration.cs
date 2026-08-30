using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class SiteBrandingConfiguration : IEntityTypeConfiguration<SiteBranding>
{
    public void Configure(EntityTypeBuilder<SiteBranding> builder)
    {
        builder.ToTable("SiteBranding");
        builder.HasKey(item => item.Id).HasName("PK_SiteBranding");
        builder.Property(item => item.BrandName).HasMaxLength(100).IsRequired();
        builder.Property(item => item.LogoUrl).HasMaxLength(500);
        builder.Property(item => item.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(item => item.UpdatedAt).HasColumnType("datetime2(0)");
    }
}
