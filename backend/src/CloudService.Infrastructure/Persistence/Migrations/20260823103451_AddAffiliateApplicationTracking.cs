using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CloudService.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAffiliateApplicationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TrackingCode",
                table: "AffiliateApplications",
                type: "varchar(40)",
                nullable: true);

            // Existing applications predate public tracking. Give each one an
            // opaque, cryptographically generated SQL Server value before the
            // unique/non-null constraints are applied; a shared empty default
            // would make the migration fail as soon as real data exists.
            migrationBuilder.Sql("""
                UPDATE [AffiliateApplications]
                SET [TrackingCode] = UPPER(CONCAT('AFF-', REPLACE(CONVERT(varchar(36), NEWID()), '-', '')))
                WHERE [TrackingCode] IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "TrackingCode",
                table: "AffiliateApplications",
                type: "varchar(40)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(40)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "UX_AffiliateApplications_TrackingCode",
                table: "AffiliateApplications",
                column: "TrackingCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_AffiliateApplications_TrackingCode",
                table: "AffiliateApplications");

            migrationBuilder.DropColumn(
                name: "TrackingCode",
                table: "AffiliateApplications");
        }
    }
}
