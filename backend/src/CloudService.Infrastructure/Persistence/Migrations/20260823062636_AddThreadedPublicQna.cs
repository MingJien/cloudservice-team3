using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddThreadedPublicQna : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ParentContactRequestId",
                table: "ContactRequests",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContactRequests_Parent_Status_CreatedAt",
                table: "ContactRequests",
                columns: new[] { "ParentContactRequestId", "Status", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_ContactRequests_Parent",
                table: "ContactRequests",
                column: "ParentContactRequestId",
                principalTable: "ContactRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContactRequests_Parent",
                table: "ContactRequests");

            migrationBuilder.DropIndex(
                name: "IX_ContactRequests_Parent_Status_CreatedAt",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "ParentContactRequestId",
                table: "ContactRequests");
        }
    }
}
