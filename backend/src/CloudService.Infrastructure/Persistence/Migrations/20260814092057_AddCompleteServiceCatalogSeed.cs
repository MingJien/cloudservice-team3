using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompleteServiceCatalogSeed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ServicePlans",
                columns: new[] { "Id", "BandwidthGb", "CategoryId", "CpuCores", "CreatedAt", "Description", "DisplayOrder", "IsActive", "Name", "QrCodePath", "QrGeneratedAt", "QrTargetUrl", "RamGb", "ShortDescription", "Slug", "SpecificationsJson", "StorageGb", "StorageType", "UpdatedAt" },
                values: new object[,]
                {
                    { 3, null, 3, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 3, true, "Cloud Domain Pro", null, null, null, null, "Tên miền doanh nghiệp với quy trình gia hạn rõ ràng", "cloud-domain-pro", "{\"Tlds\":\".com, .vn, .net\",\"Dnssec\":true,\"Privacy\":true}", null, null, null },
                    { 4, 500, 4, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 4, true, "Business Email Team", null, null, null, null, "Email theo tên miền cho nhóm làm việc nhỏ", "business-email-team", "{\"Mailboxes\":10,\"AntiSpam\":true,\"Support\":\"Business hours\"}", 50, "SSD", null },
                    { 5, null, 5, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 5, true, "SSL Business", null, null, null, null, "Chứng chỉ SSL cho website doanh nghiệp", "ssl-business", "{\"Validation\":\"Organization\",\"Warranty\":\"Up to 250000 USD\",\"Renewal\":true}", null, null, null },
                    { 6, 5000, 6, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, 6, true, "EdgeShield DDoS", null, null, null, null, "Lớp bảo vệ lưu lượng cho workload cần giảm rủi ro DDoS", "edgeshield-ddos", "{\"Protection\":\"L3-L7\",\"Traffic\":\"5TB\",\"Policy\":\"Managed\"}", null, null, null }
                });

            migrationBuilder.InsertData(
                table: "PlanPrices",
                columns: new[] { "Id", "BillingCycle", "CreatedAt", "Currency", "EffectiveFrom", "EffectiveTo", "IsActive", "OriginalPrice", "SalePrice", "ServicePlanId", "UpdatedAt" },
                values: new object[,]
                {
                    { 5, "Yearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 420000m, 360000m, 3, null },
                    { 6, "Monthly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 249000m, 199000m, 4, null },
                    { 7, "Yearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 2988000m, 2388000m, 4, null },
                    { 8, "Yearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 1890000m, 1490000m, 5, null },
                    { 9, "Monthly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 1290000m, 990000m, 6, null },
                    { 10, "Yearly", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "VND", null, null, true, 15480000m, 11880000m, 6, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "PlanPrices",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "ServicePlans",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
