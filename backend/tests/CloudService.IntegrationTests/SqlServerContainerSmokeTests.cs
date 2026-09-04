using CloudService.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Testcontainers.MsSql;
using Xunit;

namespace CloudService.IntegrationTests;

/// <summary>
/// This is intentionally opt-in: a developer can run all unit tests without
/// Docker, while CI/release runs the same test against a real SQL Server.
/// It guards the migration path that an EF InMemory provider would never test.
/// </summary>
public sealed class SqlServerContainerSmokeTests
{
    [Fact]
    public async Task Migrations_apply_to_a_real_sql_server_container()
    {
        if (!string.Equals(Environment.GetEnvironmentVariable("RUN_INTEGRATION_TESTS"), "true", StringComparison.OrdinalIgnoreCase))
            return;

        // Pin the engine image so CI does not silently change database behavior.
        await using var container = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04")
            .WithPassword("CloudService-Test-Password-2026!")
            .Build();
        await container.StartAsync();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(container.GetConnectionString())
            .Options;
        await using var db = new ApplicationDbContext(options);
        await db.Database.MigrateAsync();

        (await db.Database.CanConnectAsync()).Should().BeTrue();
        // EF Core exposes migration identifiers with their generated timestamp.
        // Matching the stable suffix proves the intended schema evolution ran,
        // without coupling this smoke test to a timestamp that is not business data.
        (await db.Database.GetAppliedMigrationsAsync())
            .Should()
            .Contain(migration => migration.EndsWith("_AddOrderExportJobsAndRefreshConcurrency", StringComparison.Ordinal));
        await db.Database.ExecuteSqlRawAsync("SELECT TOP (1) [RowVersion] FROM [RefreshTokens]");
    }
}
