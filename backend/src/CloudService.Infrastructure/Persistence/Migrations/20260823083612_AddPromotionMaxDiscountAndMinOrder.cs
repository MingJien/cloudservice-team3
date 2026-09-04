using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionMaxDiscountAndMinOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MaxDiscountAmount",
                table: "Promotions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinOrderValue",
                table: "Promotions",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Promotions_MaxDiscount",
                table: "Promotions",
                sql: "[MaxDiscountAmount] IS NULL OR [MaxDiscountAmount] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Promotions_MinOrder",
                table: "Promotions",
                sql: "[MinOrderValue] >= 0");

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_Email",
                table: "AffiliateApplications",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_Phone",
                table: "AffiliateApplications",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_WebsiteOrChannel",
                table: "AffiliateApplications",
                column: "WebsiteOrChannel",
                unique: true,
                filter: "[WebsiteOrChannel] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Promotions_MaxDiscount",
                table: "Promotions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Promotions_MinOrder",
                table: "Promotions");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_Email",
                table: "AffiliateApplications");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_Phone",
                table: "AffiliateApplications");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_WebsiteOrChannel",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "MaxDiscountAmount",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "MinOrderValue",
                table: "Promotions");
        }
    }
}
