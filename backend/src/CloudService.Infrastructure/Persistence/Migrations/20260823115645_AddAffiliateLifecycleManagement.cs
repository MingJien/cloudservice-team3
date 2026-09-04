using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAffiliateLifecycleManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_Email",
                table: "AffiliateApplications");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_Phone",
                table: "AffiliateApplications");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliateApplications_WebsiteOrChannel",
                table: "AffiliateApplications");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "AffiliateApplications",
                type: "datetime2(0)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "AffiliateApplications",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "AffiliateApplications",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_Email",
                table: "AffiliateApplications",
                column: "Email",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_Phone",
                table: "AffiliateApplications",
                column: "Phone",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateApplications_WebsiteOrChannel",
                table: "AffiliateApplications",
                column: "WebsiteOrChannel",
                unique: true,
                filter: "[WebsiteOrChannel] IS NOT NULL AND [IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "DeletedAtUtc",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "AffiliateApplications");

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
    }
}
