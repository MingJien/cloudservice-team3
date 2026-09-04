using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTestimonialModerationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Testimonials",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            // Preserve the meaning of existing records while removing the old
            // ability to expose an administrator-authored quote as customer proof.
            migrationBuilder.Sql("""
                UPDATE [Testimonials]
                SET [ModerationStatus] = CASE
                    WHEN [IsVerifiedOrder] = 1 AND [IsActive] = 1 THEN 'Published'
                    WHEN [IsVerifiedOrder] = 1 THEN 'Pending'
                    ELSE 'Hidden'
                END,
                [IsActive] = CASE WHEN [IsVerifiedOrder] = 1 THEN [IsActive] ELSE 0 END;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Testimonials_ModerationStatus",
                table: "Testimonials",
                sql: "[ModerationStatus] IN ('Pending', 'Published', 'Hidden')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Testimonials_ModerationStatus",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Testimonials");
        }
    }
}
