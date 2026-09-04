using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddContactReplies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminReply",
                table: "ContactRequests",
                type: "nvarchar(3000)",
                maxLength: 3000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RepliedAt",
                table: "ContactRequests",
                type: "datetime2(0)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingCode",
                table: "ContactRequests",
                type: "char(32)",
                nullable: false,
                defaultValueSql: "LOWER(REPLACE(CONVERT(varchar(36), NEWID()), '-', ''))");

            migrationBuilder.CreateIndex(
                name: "UX_ContactRequests_TrackingCode",
                table: "ContactRequests",
                column: "TrackingCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_ContactRequests_TrackingCode",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "AdminReply",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "ContactRequests");

            migrationBuilder.DropColumn(
                name: "TrackingCode",
                table: "ContactRequests");
        }
    }
}
