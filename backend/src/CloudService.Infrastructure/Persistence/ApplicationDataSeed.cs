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
            new { Id = 2, Name = RoleNames.Editor, Description = "Quản lý nội dung và xử lý yêu cầu", CreatedAt = SeededAt },
            new { Id = 3, Name = RoleNames.Affiliate, Description = "Đối tác tiếp thị liên kết, chỉ truy cập dữ liệu của chính mình", CreatedAt = SeededAt });

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
            },
            new
            {
                Id = 3,
                CategoryId = 3,
                Name = "Cloud Domain Pro",
                Slug = "cloud-domain-pro",
                ShortDescription = "Tên miền doanh nghiệp với quy trình gia hạn rõ ràng",
                CpuCores = (int?)null,
                RamGb = (decimal?)null,
                StorageGb = (int?)null,
                StorageType = (string?)null,
                BandwidthGb = (int?)null,
                SpecificationsJson = "{\"Tlds\":\".com, .vn, .net\",\"Dnssec\":true,\"Privacy\":true}",
                IsFeatured = false,
                DisplayOrder = 3,
                IsActive = true,
                CreatedAt = SeededAt
            },
            new
            {
                Id = 4,
                CategoryId = 4,
                Name = "Business Email Team",
                Slug = "business-email-team",
                ShortDescription = "Email theo tên miền cho nhóm làm việc nhỏ",
                CpuCores = (int?)null,
                RamGb = (decimal?)null,
                StorageGb = (int?)50,
                StorageType = "SSD",
                BandwidthGb = (int?)500,
                SpecificationsJson = "{\"Mailboxes\":10,\"AntiSpam\":true,\"Support\":\"Business hours\"}",
                IsFeatured = false,
                DisplayOrder = 4,
                IsActive = true,
                CreatedAt = SeededAt
            },
            new
            {
                Id = 5,
                CategoryId = 5,
                Name = "SSL Business",
                Slug = "ssl-business",
                ShortDescription = "Chứng chỉ SSL cho website doanh nghiệp",
                CpuCores = (int?)null,
                RamGb = (decimal?)null,
                StorageGb = (int?)null,
                StorageType = (string?)null,
                BandwidthGb = (int?)null,
                SpecificationsJson = "{\"Validation\":\"Organization\",\"Warranty\":\"Up to 250000 USD\",\"Renewal\":true}",
                IsFeatured = false,
                DisplayOrder = 5,
                IsActive = true,
                CreatedAt = SeededAt
            },
            new
            {
                Id = 6,
                CategoryId = 6,
                Name = "EdgeShield DDoS",
                Slug = "edgeshield-ddos",
                ShortDescription = "Lớp bảo vệ lưu lượng cho workload cần giảm rủi ro DDoS",
                CpuCores = (int?)null,
                RamGb = (decimal?)null,
                StorageGb = (int?)null,
                StorageType = (string?)null,
                BandwidthGb = (int?)5000,
                SpecificationsJson = "{\"Protection\":\"L3-L7\",\"Traffic\":\"5TB\",\"Policy\":\"Managed\"}",
                IsFeatured = false,
                DisplayOrder = 6,
                IsActive = true,
                CreatedAt = SeededAt
            });

        modelBuilder.Entity<PlanPrice>().HasData(
            Price(1, 1, BillingCycle.Monthly, 590000m, 490000m),
            Price(2, 1, BillingCycle.Yearly, 7080000m, 5880000m),
            Price(3, 2, BillingCycle.Monthly, 199000m, 159000m),
            Price(4, 2, BillingCycle.Yearly, 2388000m, 1908000m),
            Price(5, 3, BillingCycle.Yearly, 420000m, 360000m),
            Price(6, 4, BillingCycle.Monthly, 249000m, 199000m),
            Price(7, 4, BillingCycle.Yearly, 2988000m, 2388000m),
            Price(8, 5, BillingCycle.Yearly, 1890000m, 1490000m),
            Price(9, 6, BillingCycle.Monthly, 1290000m, 990000m),
            Price(10, 6, BillingCycle.Yearly, 15480000m, 11880000m));
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
