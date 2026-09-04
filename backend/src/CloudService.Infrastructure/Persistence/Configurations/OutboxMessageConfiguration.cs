using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudService.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages", table =>
            table.HasCheckConstraint("CK_OutboxMessages_Status", "[Status] IN ('Pending', 'Processing', 'Processed', 'DeadLetter')"));
        builder.HasKey(item => item.Id).HasName("PK_OutboxMessages");
        builder.Property(item => item.Type).HasMaxLength(200).IsRequired();
        builder.Property(item => item.Payload).HasColumnType("nvarchar(max)").IsRequired();
        builder.Property(item => item.Status).HasConversion<string>().HasColumnType("varchar(20)").HasDefaultValue(OutboxMessageStatus.Pending).HasSentinel((OutboxMessageStatus)(-1));
        builder.Property(item => item.OccurredOnUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.NextAttemptOnUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.ProcessedOnUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.LockedUntilUtc).HasColumnType("datetime2(0)");
        builder.Property(item => item.LastError).HasMaxLength(2000);
        builder.Property(item => item.RowVersion).IsRowVersion().IsConcurrencyToken();
        builder.HasIndex(item => new { item.Status, item.NextAttemptOnUtc }).HasDatabaseName("IX_OutboxMessages_Status_NextAttempt");
        builder.HasIndex(item => item.ProcessedOnUtc).HasDatabaseName("IX_OutboxMessages_ProcessedOnUtc");
    }
}
