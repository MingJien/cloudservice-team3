using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CloudService.Infrastructure.Persistence;

public sealed class DatabaseSeeder(
    ApplicationDbContext dbContext,
    IPasswordHasher passwordHasher,
    IConfiguration configuration)
{
    public async Task SeedDemoUsersAsync(CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("Seed:DemoUsers:Enabled"))
        {
            return;
        }

        await SeedUserAsync("Admin", RoleNames.Admin, cancellationToken);
        await SeedUserAsync("Editor", RoleNames.Editor, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedUserAsync(string sectionName, string roleName, CancellationToken cancellationToken)
    {
        var section = configuration.GetSection($"Seed:DemoUsers:{sectionName}");
        var userName = section["UserName"];
        var fullName = section["FullName"];
        var email = section["Email"];
        var password = section["Password"];

        if (new[] { userName, fullName, email, password }.Any(string.IsNullOrWhiteSpace))
        {
            throw new InvalidOperationException($"Demo user seed '{sectionName}' is enabled but its environment variables are incomplete.");
        }

        if (await dbContext.AppUsers.AnyAsync(user => user.UserName == userName || user.Email == email, cancellationToken))
        {
            return;
        }

        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName, cancellationToken);
        dbContext.AppUsers.Add(new AppUser(userName!, fullName!, email!, passwordHasher.Hash(password!), role.Id));
    }
}
