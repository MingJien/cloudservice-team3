using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class ContactRequestConfiguration : IEntityTypeConfiguration<ContactRequest>
{
    public void Configure(EntityTypeBuilder<ContactRequest> builder)
    {
        builder.ToTable("ContactRequests", table =>
        {
            table.HasCheckConstraint("CK_ContactRequests_Status", "[Status] IN ('New', 'Read', 'Replied')");
            table.HasCheckConstraint("CK_ContactRequests_RepliedByRole", "[RepliedByRole] IS NULL OR [RepliedByRole] IN ('Admin', 'Editor')");
        });
        builder.HasKey(x => x.Id).HasName("PK_ContactRequests");
        builder.Property(x => x.TrackingCode).HasColumnType("varchar(32)").IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Phone).HasColumnType("varchar(20)");
        builder.Property(x => x.Subject).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(3000).IsRequired();
        builder.Property(x => x.AdminReply).HasMaxLength(3000);
        builder.Property(x => x.RepliedByRole).HasConversion<string>().HasColumnType("varchar(20)");
        builder.Property(x => x.RepliedAt).HasColumnType("datetime2(0)");
        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasColumnType("varchar(20)")
            .HasDefaultValue(ContactRequestStatus.New)
            .HasSentinel((ContactRequestStatus)(-1));
        builder.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").HasDefaultValueSql("SYSUTCDATETIME()");
        builder.Property(x => x.UpdatedAt).HasColumnType("datetime2(0)");
        builder.HasIndex(x => new { x.Status, x.CreatedAt }).IsDescending(false, true).HasDatabaseName("IX_ContactRequests_Status_CreatedAt");
        builder.HasIndex(x => x.TrackingCode).IsUnique().HasDatabaseName("UX_ContactRequests_TrackingCode");
        builder.HasIndex(x => new { x.ParentContactRequestId, x.Status, x.CreatedAt })
            .HasDatabaseName("IX_ContactRequests_Parent_Status_CreatedAt");
        builder.HasOne(x => x.Parent)
            .WithMany(x => x.FollowUps)
            .HasForeignKey(x => x.ParentContactRequestId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("FK_ContactRequests_Parent");
    }
}
