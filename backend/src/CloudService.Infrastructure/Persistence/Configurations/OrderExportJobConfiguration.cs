using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class OrderExportJobConfiguration : IEntityTypeConfiguration<OrderExportJob>
{
    public void Configure(EntityTypeBuilder<OrderExportJob> builder)
    {
        builder.ToTable("OrderExportJobs", table =>
            table.HasCheckConstraint("CK_OrderExportJobs_Status", "[Status] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Expired')"));
        builder.HasKey(item => item.Id).HasName("PK_OrderExportJobs");
        builder.Property(item => item.Status).HasConversion<string>().HasColumnType("varchar(20)").IsRequired();
        builder.Property(item => item.StatusFilter).HasConversion<string>().HasColumnType("varchar(20)");
        builder.Property(item => item.Search).HasMaxLength(200);
        builder.Property(item => item.RequestedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.StartedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.CompletedAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.ExpiresAtUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.FileName).HasMaxLength(255);
        builder.Property(item => item.ContentType).HasMaxLength(150);
        builder.Property(item => item.Content).HasColumnType("varbinary(max)");
        builder.Property(item => item.Error).HasMaxLength(2000);
        builder.Property(item => item.RowVersion).IsRowVersion().IsConcurrencyToken();
        builder.HasIndex(item => new { item.Status, item.RequestedAtUtc }).HasDatabaseName("IX_OrderExportJobs_Status_RequestedAt");
        builder.HasIndex(item => new { item.RequestedByUserId, item.RequestedAtUtc }).HasDatabaseName("IX_OrderExportJobs_User_RequestedAt");
        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(item => item.RequestedByUserId)
            .OnDelete(DeleteBehavior.NoAction)
            .HasConstraintName("FK_OrderExportJobs_AppUsers");
    }
}
