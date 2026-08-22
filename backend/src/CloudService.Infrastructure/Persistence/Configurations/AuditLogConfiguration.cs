using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs", table =>
        {
            table.HasCheckConstraint("CK_AuditLogs_OldValuesJson", "[OldValues] IS NULL OR ISJSON([OldValues]) = 1");
            table.HasCheckConstraint("CK_AuditLogs_NewValuesJson", "[NewValues] IS NULL OR ISJSON([NewValues]) = 1");
        });
        builder.HasKey(x => x.Id).HasName("PK_AuditLogs");
        builder.Property(x => x.Action).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(100);
        builder.Property(x => x.EntityId).HasMaxLength(100);
        builder.Property(x => x.OldValues).HasColumnType("nvarchar(max)");
        builder.Property(x => x.NewValues).HasColumnType("nvarchar(max)");
        builder.Property(x => x.IpAddress).HasColumnType("varchar(45)");
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.HasIndex(x => new { x.UserId, x.CreatedAt }).IsDescending(false, true).HasDatabaseName("IX_AuditLogs_UserId_CreatedAt");
        builder.HasIndex(x => new { x.EntityName, x.EntityId, x.CreatedAt }).IsDescending(false, false, true).HasDatabaseName("IX_AuditLogs_Entity");
        builder.HasOne(x => x.User).WithMany(x => x.AuditLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull).HasConstraintName("FK_AuditLogs_AppUsers");
    }
}
