using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAffiliatePartnerPortal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "AppUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "AppUserId",
                table: "AffiliatePartners",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImportedClickCount",
                table: "AffiliatePartners",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ImportedConversionCount",
                table: "AffiliatePartners",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Tier",
                table: "AffiliatePartners",
                type: "varchar(20)",
                nullable: false,
                defaultValue: "Newbie");

            migrationBuilder.AddColumn<DateTime>(
                name: "TierEvaluatedAtUtc",
                table: "AffiliatePartners",
                type: "datetime2(0)",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AffiliatePayoutId",
                table: "AffiliateAttributions",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AffiliatePayouts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AffiliatePartnerId = table.Column<long>(type: "bigint", nullable: false),
                    RequestCode = table.Column<string>(type: "varchar(30)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankAccountNumber = table.Column<string>(type: "varchar(32)", nullable: false),
                    BankAccountName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false, defaultValue: "Requested"),
                    RequestedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    PaidAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    ReviewNote = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliatePayouts", x => x.Id);
                    table.CheckConstraint("CK_AffiliatePayouts_Amount", "[Amount] >= 500000");
                    table.CheckConstraint("CK_AffiliatePayouts_Status", "[Status] IN ('Requested', 'Processing', 'Paid', 'Rejected')");
                    table.ForeignKey(
                        name: "FK_AffiliatePayouts_AffiliatePartners",
                        column: x => x.AffiliatePartnerId,
                        principalTable: "AffiliatePartners",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "Description", "Name" },
                values: new object[] { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Đối tác tiếp thị liên kết, chỉ truy cập dữ liệu của chính mình", "Affiliate" });

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliatePartners_AppUserId",
                table: "AffiliatePartners",
                column: "AppUserId",
                unique: true,
                filter: "[AppUserId] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AffiliatePartners_ImportedCounters",
                table: "AffiliatePartners",
                sql: "[ImportedClickCount] >= 0 AND [ImportedConversionCount] >= 0 AND [ImportedConversionCount] <= [ImportedClickCount]");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AffiliatePartners_Tier",
                table: "AffiliatePartners",
                sql: "[Tier] IN ('Newbie', 'Bronze', 'Silver', 'Gold')");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateAttributions_PayoutId",
                table: "AffiliateAttributions",
                column: "AffiliatePayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliatePayouts_Partner_Status_RequestedAt",
                table: "AffiliatePayouts",
                columns: new[] { "AffiliatePartnerId", "Status", "RequestedAtUtc" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliatePayouts_RequestCode",
                table: "AffiliatePayouts",
                column: "RequestCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AffiliateAttributions_AffiliatePayouts",
                table: "AffiliateAttributions",
                column: "AffiliatePayoutId",
                principalTable: "AffiliatePayouts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_AffiliatePartners_AppUsers",
                table: "AffiliatePartners",
                column: "AppUserId",
                principalTable: "AppUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AffiliateAttributions_AffiliatePayouts",
                table: "AffiliateAttributions");

            migrationBuilder.DropForeignKey(
                name: "FK_AffiliatePartners_AppUsers",
                table: "AffiliatePartners");

            migrationBuilder.DropTable(
                name: "AffiliatePayouts");

            migrationBuilder.DropIndex(
                name: "UQ_AffiliatePartners_AppUserId",
                table: "AffiliatePartners");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AffiliatePartners_ImportedCounters",
                table: "AffiliatePartners");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AffiliatePartners_Tier",
                table: "AffiliatePartners");

            migrationBuilder.DropIndex(
                name: "IX_AffiliateAttributions_PayoutId",
                table: "AffiliateAttributions");

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "AppUsers");

            migrationBuilder.DropColumn(
                name: "AppUserId",
                table: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "ImportedClickCount",
                table: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "ImportedConversionCount",
                table: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "Tier",
                table: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "TierEvaluatedAtUtc",
                table: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "AffiliatePayoutId",
                table: "AffiliateAttributions");
        }
    }
}
