using CloudService.Domain.Constants;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

internal static class ApplicationDataSeed
{
    private static readonly DateTime SeededAt = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasData(
            new { Id = 1, Name = RoleNames.Admin, Description = "Toàn quyền quản trị hệ thống", CreatedAt = SeededAt },
            new { Id = 2, Name = RoleNames.Editor, Description = "Quản lý nội dung và xử lý yêu cầu", CreatedAt = SeededAt });

        modelBuilder.Entity<ServiceCategory>().HasData(
            Category(1, "VPS", "vps", "Máy chủ ảo hiệu năng cao", 1),
            Category(2, "Hosting", "hosting", "Dịch vụ lưu trữ website", 2),
            Category(3, "Domain", "domain", "Đăng ký và quản lý tên miền", 3),
            Category(4, "Email doanh nghiệp", "business-email", "Email theo tên miền doanh nghiệp", 4),
            Category(5, "SSL", "ssl", "Chứng chỉ bảo mật website", 5),
            Category(6, "Firewall chống DDoS", "ddos-firewall", "Giải pháp bảo vệ hạ tầng trước tấn công DDoS", 6));

        modelBuilder.Entity<ServicePlan>().HasData(
            new
            {
                Id = 1,
                CategoryId = 1,
                Name = "Cloud VPS Basic",
                Slug = "cloud-vps-basic",
                ShortDescription = "Gói VPS phù hợp website và ứng dụng nhỏ",
                CpuCores = (int?)2,
                RamGb = (decimal?)2m,
                StorageGb = (int?)40,
                StorageType = "NVMe",
                BandwidthGb = (int?)2000,
                SpecificationsJson = "{\"IPv4\":1,\"Backup\":\"Weekly\",\"Uptime\":\"99.9%\"}",
                IsFeatured = true,
                DisplayOrder = 1,
                IsActive = true,
                CreatedAt = SeededAt
            },
            new
            {
                Id = 2,
                CategoryId = 2,
                Name = "Business Hosting",
                Slug = "business-hosting",
                ShortDescription = "Hosting cho website doanh nghiệp",
                CpuCores = (int?)null,
                RamGb = (decimal?)null,
                StorageGb = (int?)20,
                StorageType = "NVMe",
                BandwidthGb = (int?)1000,
                SpecificationsJson = "{\"Websites\":5,\"EmailAccounts\":20,\"SSL\":\"Included\"}",
                IsFeatured = true,
                DisplayOrder = 2,
                IsActive = true,
                CreatedAt = SeededAt
            });

        modelBuilder.Entity<PlanPrice>().HasData(
            Price(1, 1, BillingCycle.Monthly, 590000m, 490000m),
            Price(2, 1, BillingCycle.Yearly, 7080000m, 5880000m),
            Price(3, 2, BillingCycle.Monthly, 199000m, 159000m),
            Price(4, 2, BillingCycle.Yearly, 2388000m, 1908000m));
    }

    private static object Category(int id, string name, string slug, string description, int displayOrder) => new
    {
        Id = id,
        Name = name,
        Slug = slug,
        Description = description,
        DisplayOrder = displayOrder,
        IsActive = true,
        CreatedAt = SeededAt
    };

    private static object Price(int id, int servicePlanId, BillingCycle billingCycle, decimal originalPrice, decimal salePrice) => new
    {
        Id = id,
        ServicePlanId = servicePlanId,
        BillingCycle = billingCycle,
        OriginalPrice = originalPrice,
        SalePrice = (decimal?)salePrice,
        Currency = "VND",
        IsActive = true,
        CreatedAt = SeededAt
    };
}
