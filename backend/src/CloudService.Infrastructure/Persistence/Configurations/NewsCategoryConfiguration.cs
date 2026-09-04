using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class NewsCategoryConfiguration : IEntityTypeConfiguration<NewsCategory>
{
    public void Configure(EntityTypeBuilder<NewsCategory> builder)
    {
        builder.ToTable("NewsCategories");
        builder.HasKey(x => x.Id).HasName("PK_NewsCategories");
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Slug).HasColumnType("varchar(120)").IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("UQ_NewsCategories_Slug");
    }
}
