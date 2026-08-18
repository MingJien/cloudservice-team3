using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class NewsArticleConfiguration : IEntityTypeConfiguration<NewsArticle>
{
    public void Configure(EntityTypeBuilder<NewsArticle> builder)
    {
        builder.ToTable("NewsArticles", table =>
        {
            table.HasCheckConstraint("CK_NewsArticles_ViewCount", "[ViewCount] >= 0");
            table.HasCheckConstraint("CK_NewsArticles_PublishDate", "[IsPublished] = 0 OR [PublishedAt] IS NOT NULL");
        });
        builder.HasKey(x => x.Id).HasName("PK_NewsArticles");
        builder.Property(x => x.Title).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Slug).HasColumnType("varchar(280)").IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1000);
        builder.Property(x => x.Content).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.Property(x => x.AuthorName).HasMaxLength(150);
        builder.Property(x => x.PublishedAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.IsPublished).HasDefaultValue(false);
        builder.Property(x => x.ViewCount).HasDefaultValue(0);
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => x.Slug).IsUnique().HasDatabaseName("UQ_NewsArticles_Slug");
        builder.HasIndex(x => new { x.CategoryId, x.IsPublished, x.PublishedAt }).IsDescending(false, false, true).HasDatabaseName("IX_NewsArticles_Category_Published");
        builder.HasOne(x => x.Category).WithMany(x => x.Articles).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_NewsArticles_NewsCategories");
    }
}
