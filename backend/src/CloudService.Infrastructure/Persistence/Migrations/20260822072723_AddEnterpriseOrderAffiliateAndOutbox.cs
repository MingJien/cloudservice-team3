using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEnterpriseOrderAffiliateAndOutbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "OrderRequests",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateTable(
                name: "AffiliatePartners",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicationId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "varchar(50)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CommissionRate = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliatePartners", x => x.Id);
                    table.CheckConstraint("CK_AffiliatePartners_CommissionRate", "[CommissionRate] >= 0 AND [CommissionRate] <= 100");
                    table.ForeignKey(
                        name: "FK_AffiliatePartners_AffiliateApplications",
                        column: x => x.ApplicationId,
                        principalTable: "AffiliateApplications",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ApiIdempotencyRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Scope = table.Column<string>(type: "varchar(100)", nullable: false),
                    KeyHash = table.Column<string>(type: "char(64)", nullable: false),
                    RequestHash = table.Column<string>(type: "char(64)", nullable: false),
                    ResponseJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StatusCode = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApiIdempotencyRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OccurredOnUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false, defaultValue: "Pending"),
                    AttemptCount = table.Column<int>(type: "int", nullable: false),
                    NextAttemptOnUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ProcessedOnUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    LockedUntilUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    LockId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LastError = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                    table.CheckConstraint("CK_OutboxMessages_Status", "[Status] IN ('Pending', 'Processing', 'Processed', 'DeadLetter')");
                });

            migrationBuilder.CreateTable(
                name: "AffiliateAttributions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AffiliatePartnerId = table.Column<long>(type: "bigint", nullable: false),
                    OrderRequestId = table.Column<long>(type: "bigint", nullable: false),
                    AffiliateCodeSnapshot = table.Column<string>(type: "varchar(50)", nullable: false),
                    CommissionRateSnapshot = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    RevenueSnapshot = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", nullable: false, defaultValue: "Pending"),
                    EligibleAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    PaidAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateAttributions", x => x.Id);
                    table.CheckConstraint("CK_AffiliateAttributions_Amounts", "[RevenueSnapshot] >= 0 AND [CommissionAmount] >= 0");
                    table.CheckConstraint("CK_AffiliateAttributions_CommissionRate", "[CommissionRateSnapshot] >= 0 AND [CommissionRateSnapshot] <= 100");
                    table.CheckConstraint("CK_AffiliateAttributions_Status", "[Status] IN ('Pending', 'Eligible', 'Rejected', 'Paid')");
                    table.ForeignKey(
                        name: "FK_AffiliateAttributions_AffiliatePartners",
                        column: x => x.AffiliatePartnerId,
                        principalTable: "AffiliatePartners",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AffiliateAttributions_OrderRequests",
                        column: x => x.OrderRequestId,
                        principalTable: "OrderRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AffiliateReferrals",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AffiliatePartnerId = table.Column<long>(type: "bigint", nullable: false),
                    VisitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: false),
                    ConvertedAtUtc = table.Column<DateTime>(type: "datetime2(0)", nullable: true),
                    OrderRequestId = table.Column<long>(type: "bigint", nullable: true),
                    LandingPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Referrer = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(0)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AffiliateReferrals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AffiliateReferrals_AffiliatePartners",
                        column: x => x.AffiliatePartnerId,
                        principalTable: "AffiliatePartners",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AffiliateReferrals_OrderRequests",
                        column: x => x.OrderRequestId,
                        principalTable: "OrderRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateAttributions_Partner_Status_CreatedAt",
                table: "AffiliateAttributions",
                columns: new[] { "AffiliatePartnerId", "Status", "CreatedAt" },
                descending: new[] { false, false, true });

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateAttributions_OrderRequestId",
                table: "AffiliateAttributions",
                column: "OrderRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliatePartners_ApplicationId",
                table: "AffiliatePartners",
                column: "ApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliatePartners_Code",
                table: "AffiliatePartners",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateReferrals_OrderRequestId",
                table: "AffiliateReferrals",
                column: "OrderRequestId",
                unique: true,
                filter: "[OrderRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AffiliateReferrals_Partner_CreatedAt",
                table: "AffiliateReferrals",
                columns: new[] { "AffiliatePartnerId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "UQ_AffiliateReferrals_VisitId",
                table: "AffiliateReferrals",
                column: "VisitId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApiIdempotencyRecords_ExpiresAtUtc",
                table: "ApiIdempotencyRecords",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "UQ_ApiIdempotencyRecords_Scope_KeyHash",
                table: "ApiIdempotencyRecords",
                columns: new[] { "Scope", "KeyHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_ProcessedOnUtc",
                table: "OutboxMessages",
                column: "ProcessedOnUtc");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessages_Status_NextAttempt",
                table: "OutboxMessages",
                columns: new[] { "Status", "NextAttemptOnUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AffiliateAttributions");

            migrationBuilder.DropTable(
                name: "AffiliateReferrals");

            migrationBuilder.DropTable(
                name: "ApiIdempotencyRecords");

            migrationBuilder.DropTable(
                name: "OutboxMessages");

            migrationBuilder.DropTable(
                name: "AffiliatePartners");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "OrderRequests");
        }
    }
}
