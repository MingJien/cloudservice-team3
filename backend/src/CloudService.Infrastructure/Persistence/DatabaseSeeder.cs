using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
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

    public async Task SeedDemoContentAsync(CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("Seed:DemoContent:Enabled"))
        {
            return;
        }

        var category = await dbContext.NewsCategories.SingleOrDefaultAsync(item => item.Slug == "cloud-operations", cancellationToken);
        if (category is null)
        {
            category = new NewsCategory("Vận hành cloud", "cloud-operations");
            category.Update(category.Name, category.Slug, "Kiến thức triển khai và vận hành hạ tầng cloud.");
            dbContext.NewsCategories.Add(category);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await dbContext.NewsArticles.AnyAsync(item => item.Slug == "checklist-trien-khai-vps", cancellationToken))
        {
            var article = new NewsArticle(category.Id, "Checklist triển khai VPS an toàn", "checklist-trien-khai-vps", "Một checklist ngắn để kiểm tra access, backup, monitoring và phương án rollback trước khi đưa workload lên VPS.");
            article.Update(category.Id, article.Title, article.Slug, "Các điểm cần kiểm tra trước khi đưa workload lên môi trường cloud.", article.Content, null, "MekongNode Engineering");
            article.Publish(DateTime.UtcNow.AddDays(-2));
            dbContext.NewsArticles.Add(article);
        }

        if (!await dbContext.NewsArticles.AnyAsync(item => item.Slug == "chon-chu-ky-gia-cloud", cancellationToken))
        {
            var article = new NewsArticle(category.Id, "Cách chọn chu kỳ giá cloud", "chon-chu-ky-gia-cloud", "So sánh nhu cầu ngắn hạn, cam kết sử dụng và chi phí theo tháng hoặc theo năm bằng dữ liệu báo giá từ hệ thống.");
            article.Update(category.Id, article.Title, article.Slug, "So sánh chu kỳ thanh toán trước khi gửi yêu cầu dịch vụ.", article.Content, null, "MekongNode Engineering");
            article.Publish(DateTime.UtcNow.AddDays(-1));
            dbContext.NewsArticles.Add(article);
        }

        if (!await dbContext.Testimonials.AnyAsync(item => item.CustomerName == "Demo Workspace", cancellationToken))
        {
            dbContext.Testimonials.Add(new Testimonial(
                "Demo Workspace",
                "Bản ghi demo dùng để kiểm tra giao diện testimonial và không đại diện cho khách hàng thực tế.",
                5,
                1));
        }

        const string legacyFlashDescription = "Khuyến mãi demo có thời hạn thật để kiểm thử countdown; không tự gia hạn sau khi hết hạn.";
        var legacyFlash = await dbContext.Promotions.SingleOrDefaultAsync(item => item.Code == "FLASH20", cancellationToken);
        if (legacyFlash is not null && string.Equals(legacyFlash.Description, legacyFlashDescription, StringComparison.Ordinal))
        {
            legacyFlash.SetActive(false);
        }

        if (!await dbContext.Promotions.AnyAsync(item => item.Code == "FLASH45", cancellationToken))
        {
            var utcNow = DateTime.UtcNow;
            var promotion = new Promotion(
                "FLASH45",
                "Flash Sale 45% gói nổi bật",
                DiscountType.Percentage,
                45m,
                utcNow.AddHours(-1),
                utcNow.AddDays(7));
            promotion.Update(
                promotion.Code,
                promotion.Name,
                promotion.DiscountType,
                promotion.DiscountValue,
                promotion.StartAt,
                promotion.EndAt,
                200,
                "Flash Sale demo giới hạn 200 yêu cầu, có thời hạn thật để kiểm thử countdown; không tự gia hạn.");
            dbContext.Promotions.Add(promotion);
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.PromotionServicePlans.Add(new PromotionServicePlan(promotion.Id, 1));
        }

        if (!await dbContext.AffiliatePartners.AnyAsync(item => item.Code == "KOL123", cancellationToken))
        {
            var application = await dbContext.AffiliateApplications
                .SingleOrDefaultAsync(item => item.Email == "affiliate.demo@cloudservice.local", cancellationToken);
            if (application is null)
            {
                application = new AffiliateApplication("Đối tác Demo KOL", "affiliate.demo@cloudservice.local", "0900000000");
                application.SetDetails("https://example.com/cloud-review", "Dữ liệu mẫu để trình diễn attribution ?ref=KOL123.");
                application.ChangeStatus(AffiliateApplicationStatus.Processing, "Hồ sơ demo đã được tiếp nhận.");
                application.ChangeStatus(AffiliateApplicationStatus.Done, "Đối tác demo đã được duyệt.");
                dbContext.AffiliateApplications.Add(application);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            dbContext.AffiliatePartners.Add(new AffiliatePartner(application.Id, "KOL123", application.FullName, 10m));
        }

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

        var existingUser = await dbContext.AppUsers
            .SingleOrDefaultAsync(user => user.UserName == userName || user.Email == email, cancellationToken);
        if (existingUser is not null)
        {
            if (configuration.GetValue<bool>("Seed:DemoUsers:ResetPasswordOnStartup"))
            {
                var utcNow = DateTime.UtcNow;
                existingUser.ChangePasswordHash(passwordHasher.Hash(password!), utcNow);
                var activeTokens = await dbContext.RefreshTokens
                    .Where(token => token.UserId == existingUser.Id && token.RevokedAt == null && token.ExpiresAt > utcNow)
                    .ToArrayAsync(cancellationToken);
                foreach (var activeToken in activeTokens)
                {
                    activeToken.Revoke(utcNow);
                }
            }

            return;
        }

        var role = await dbContext.Roles.SingleAsync(item => item.Name == roleName, cancellationToken);
        dbContext.AppUsers.Add(new AppUser(userName!, fullName!, email!, passwordHasher.Hash(password!), role.Id));
    }
}
