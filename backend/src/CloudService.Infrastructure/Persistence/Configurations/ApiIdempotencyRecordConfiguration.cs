using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class ApiIdempotencyRecordConfiguration : IEntityTypeConfiguration<ApiIdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<ApiIdempotencyRecord> builder)
    {
        builder.ToTable("ApiIdempotencyRecords");
        builder.HasKey(item => item.Id).HasName("PK_ApiIdempotencyRecords");
        builder.Property(item => item.Scope).HasColumnType("varchar(100)").IsRequired();
        builder.Property(item => item.KeyHash).HasColumnType("char(64)").IsRequired();
        builder.Property(item => item.RequestHash).HasColumnType("char(64)").IsRequired();
        builder.Property(item => item.ResponseJson).HasColumnType("nvarchar(max)");
        builder.Property(item => item.CreatedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.ExpiresAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.CompletedAtUtc).HasColumnType("datetime2(0)");
        builder.HasIndex(item => new { item.Scope, item.KeyHash }).IsUnique().HasDatabaseName("UQ_ApiIdempotencyRecords_Scope_KeyHash");
        builder.HasIndex(item => item.ExpiresAtUtc).HasDatabaseName("IX_ApiIdempotencyRecords_ExpiresAtUtc");
    }
}
