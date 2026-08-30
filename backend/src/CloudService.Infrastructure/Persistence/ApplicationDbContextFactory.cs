using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CloudService.Infrastructure.Persistence;

public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    private const string LocalDockerConnection =
        "Server=localhost,14330;Database=CloudServiceDb;User Id=sa;Password=CloudDB2026Server;TrustServerCertificate=True;Encrypt=False;App=EntityFramework";

    public ApplicationDbContext CreateDbContext(string[] args)
    {
        // Keep EF tooling aligned with the documented Docker development stack.
        // Deployments must always supply the environment override; no developer-
        // specific SQL Server instance is allowed as an implicit fallback.
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? LocalDockerConnection;
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        return new ApplicationDbContext(options);
    }
}
