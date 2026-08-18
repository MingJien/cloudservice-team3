using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens", table => table.HasCheckConstraint("CK_RefreshTokens_ExpiresAt", "[ExpiresAt] > [CreatedAt]"));
        builder.HasKey(x => x.Id).HasName("PK_RefreshTokens");
        builder.Property(x => x.TokenHash).HasColumnType("varchar(128)").IsRequired();
        builder.Property(x => x.JwtId).HasColumnType("varchar(100)");
        builder.Property(x => x.ExpiresAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.RevokedAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.ReplacedByHash).HasColumnType("varchar(128)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.CreatedByIp).HasColumnType("varchar(45)");
        builder.HasIndex(x => x.TokenHash).IsUnique().HasDatabaseName("UQ_RefreshTokens_TokenHash");
        builder.HasIndex(x => new { x.UserId, x.ExpiresAt }).HasDatabaseName("IX_RefreshTokens_UserId_ExpiresAt");
        builder.HasOne(x => x.User).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction).HasConstraintName("FK_RefreshTokens_AppUsers");
    }
}
