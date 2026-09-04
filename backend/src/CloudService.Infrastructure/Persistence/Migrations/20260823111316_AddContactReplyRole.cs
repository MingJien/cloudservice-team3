using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContactReplyRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RepliedByRole",
                table: "ContactRequests",
                type: "varchar(20)",
                nullable: true);

            // Replies created before author snapshots were introduced came from
            // the original administrator workflow. Backfilling only answered
            // rows keeps pending requests semantically clean.
            migrationBuilder.Sql(
                "UPDATE [ContactRequests] SET [RepliedByRole] = 'Admin' " +
                "WHERE [AdminReply] IS NOT NULL AND [RepliedByRole] IS NULL;");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ContactRequests_RepliedByRole",
                table: "ContactRequests",
                sql: "[RepliedByRole] IS NULL OR [RepliedByRole] IN ('Admin', 'Editor')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_ContactRequests_RepliedByRole",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "RepliedByRole",
                table: "ContactRequests");
        }
    }
}
