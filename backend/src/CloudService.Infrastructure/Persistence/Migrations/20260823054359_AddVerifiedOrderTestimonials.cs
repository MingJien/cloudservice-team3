using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVerifiedOrderTestimonials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFeaturedCustomer",
                table: "Testimonials",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVerifiedOrder",
                table: "Testimonials",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "OrderRequestId",
                table: "Testimonials",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "UX_Testimonials_OrderRequestId",
                table: "Testimonials",
                column: "OrderRequestId",
                unique: true,
                filter: "[OrderRequestId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Testimonials_OrderRequests_OrderRequestId",
                table: "Testimonials",
                column: "OrderRequestId",
                principalTable: "OrderRequests",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Testimonials_OrderRequests_OrderRequestId",
                table: "Testimonials");

            migrationBuilder.DropIndex(
                name: "UX_Testimonials_OrderRequestId",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "IsFeaturedCustomer",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "IsVerifiedOrder",
                table: "Testimonials");

            migrationBuilder.DropColumn(
                name: "OrderRequestId",
                table: "Testimonials");
        }
    }
}
