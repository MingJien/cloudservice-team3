using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderExportJobsAndRefreshConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "RefreshTokens",
                type: "rowversion",
                rowVersion: true,
                nullable: false);

            migrationBuilder.CreateTable(
                name: "OrderExportJobs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByUserId = table.Column<int>(type: "int", nullable: false),
                    StatusFilter = table.Column<string>(type: "varchar(20)", nullable: true),
                    Search = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    ContentType = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Content = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    Error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderExportJobs", x => x.Id);
                    table.CheckConstraint("CK_OrderExportJobs_Status", "[Status] IN ('Pending', 'Processing', 'Completed', 'Failed', 'Expired')");
                    table.ForeignKey(
                        name: "FK_OrderExportJobs_AppUsers",
                        column: x => x.RequestedByUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderExportJobs_Status_RequestedAt",
                table: "OrderExportJobs",
                columns: new[] { "Status", "RequestedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderExportJobs_User_RequestedAt",
                table: "OrderExportJobs",
                columns: new[] { "RequestedByUserId", "RequestedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderExportJobs");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "RefreshTokens");
        }
    }
}
