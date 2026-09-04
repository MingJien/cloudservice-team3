using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteConcurrencyAndAuditRetention : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ServicePlans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ServiceCategories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Promotions",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PlanPrices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "PlanPrices",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "NewsArticles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ServicePlans_Deleted_Category_Active",
                table: "ServicePlans",
                columns: new[] { "IsDeleted", "CategoryId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_Deleted_Active",
                table: "ServiceCategories",
                columns: new[] { "IsDeleted", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanPrices_Deleted_Plan_Active",
                table: "PlanPrices",
                columns: new[] { "IsDeleted", "ServicePlanId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_NewsArticles_Deleted_Category_Published",
                table: "NewsArticles",
                columns: new[] { "IsDeleted", "CategoryId", "IsPublished" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePlans_Deleted_Category_Active",
                table: "ServicePlans");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_Deleted_Active",
                table: "ServiceCategories");

            migrationBuilder.DropIndex(
                name: "IX_PlanPrices_Deleted_Plan_Active",
                table: "PlanPrices");

            migrationBuilder.DropIndex(
                name: "IX_NewsArticles_Deleted_Category_Published",
                table: "NewsArticles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ServicePlans");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ServiceCategories");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PlanPrices");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "PlanPrices");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "NewsArticles");
        }
    }
}
