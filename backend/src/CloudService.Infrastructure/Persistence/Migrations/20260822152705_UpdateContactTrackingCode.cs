using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateContactTrackingCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TrackingCode",
                table: "ContactRequests",
                type: "varchar(32)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(32)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TrackingCode",
                table: "ContactRequests",
                type: "char(32)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)");
        }
    }
}
