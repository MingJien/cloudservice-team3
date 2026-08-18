/*
    Project: Website Ban Dich vu Cloud
    Database: CloudServiceDb - SQL Server
    Purpose: Schema contract v1 + sample public data
    Safety: Script does not drop existing database/tables.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_ID(N'CloudServiceDb') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE [CloudServiceDb]');
END;
GO

USE [CloudServiceDb];
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
        Name            nvarchar(50) NOT NULL,
        Description     nvarchar(255) NULL,
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Roles_Name UNIQUE (Name)
    );
END;
GO

IF OBJECT_ID(N'dbo.AppUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AppUsers
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AppUsers PRIMARY KEY,
        UserName        nvarchar(50) NOT NULL,
        FullName        nvarchar(150) NOT NULL,
        Email           nvarchar(255) NOT NULL,
        PasswordHash    nvarchar(500) NOT NULL,
        RoleId          int NOT NULL,
        IsActive        bit NOT NULL CONSTRAINT DF_AppUsers_IsActive DEFAULT (1),
        LastLoginAt     datetime2(0) NULL,
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_AppUsers_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT UQ_AppUsers_UserName UNIQUE (UserName),
        CONSTRAINT UQ_AppUsers_Email UNIQUE (Email),
        CONSTRAINT FK_AppUsers_Roles FOREIGN KEY (RoleId) REFERENCES dbo.Roles(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens
    (
        Id              bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_RefreshTokens PRIMARY KEY,
        UserId          int NOT NULL,
        TokenHash       varchar(128) NOT NULL,
        JwtId           varchar(100) NULL,
        ExpiresAt       datetime2(0) NOT NULL,
        RevokedAt       datetime2(0) NULL,
        ReplacedByHash  varchar(128) NULL,
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAt DEFAULT SYSUTCDATETIME(),
        CreatedByIp     varchar(45) NULL,
        CONSTRAINT UQ_RefreshTokens_TokenHash UNIQUE (TokenHash),
        CONSTRAINT FK_RefreshTokens_AppUsers FOREIGN KEY (UserId) REFERENCES dbo.AppUsers(Id),
        CONSTRAINT CK_RefreshTokens_ExpiresAt CHECK (ExpiresAt > CreatedAt)
    );
    CREATE INDEX IX_RefreshTokens_UserId_ExpiresAt ON dbo.RefreshTokens(UserId, ExpiresAt);
END;
GO

IF OBJECT_ID(N'dbo.ServiceCategories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ServiceCategories
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ServiceCategories PRIMARY KEY,
        Name            nvarchar(100) NOT NULL,
        Slug            varchar(120) NOT NULL,
        Description     nvarchar(1000) NULL,
        Icon            nvarchar(255) NULL,
        DisplayOrder    int NOT NULL CONSTRAINT DF_ServiceCategories_DisplayOrder DEFAULT (0),
        IsActive        bit NOT NULL CONSTRAINT DF_ServiceCategories_IsActive DEFAULT (1),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_ServiceCategories_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT UQ_ServiceCategories_Slug UNIQUE (Slug),
        CONSTRAINT CK_ServiceCategories_DisplayOrder CHECK (DisplayOrder >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.ServicePlans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ServicePlans
    (
        Id                  int IDENTITY(1,1) NOT NULL CONSTRAINT PK_ServicePlans PRIMARY KEY,
        CategoryId          int NOT NULL,
        Name                nvarchar(150) NOT NULL,
        Slug                varchar(180) NOT NULL,
        ShortDescription    nvarchar(500) NULL,
        Description         nvarchar(max) NULL,
        CpuCores            int NULL,
        RamGb               decimal(8,2) NULL,
        StorageGb           int NULL,
        StorageType         nvarchar(30) NULL,
        BandwidthGb         int NULL,
        SpecificationsJson  nvarchar(max) NULL,
        QrTargetUrl         nvarchar(500) NULL,
        QrCodePath          nvarchar(500) NULL,
        QrGeneratedAt       datetime2(0) NULL,
        IsFeatured          bit NOT NULL CONSTRAINT DF_ServicePlans_IsFeatured DEFAULT (0),
        DisplayOrder        int NOT NULL CONSTRAINT DF_ServicePlans_DisplayOrder DEFAULT (0),
        IsActive            bit NOT NULL CONSTRAINT DF_ServicePlans_IsActive DEFAULT (1),
        CreatedAt           datetime2(0) NOT NULL CONSTRAINT DF_ServicePlans_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt           datetime2(0) NULL,
        CONSTRAINT UQ_ServicePlans_Slug UNIQUE (Slug),
        CONSTRAINT FK_ServicePlans_ServiceCategories FOREIGN KEY (CategoryId) REFERENCES dbo.ServiceCategories(Id),
        CONSTRAINT CK_ServicePlans_CpuCores CHECK (CpuCores IS NULL OR CpuCores > 0),
        CONSTRAINT CK_ServicePlans_RamGb CHECK (RamGb IS NULL OR RamGb > 0),
        CONSTRAINT CK_ServicePlans_StorageGb CHECK (StorageGb IS NULL OR StorageGb > 0),
        CONSTRAINT CK_ServicePlans_BandwidthGb CHECK (BandwidthGb IS NULL OR BandwidthGb > 0),
        CONSTRAINT CK_ServicePlans_DisplayOrder CHECK (DisplayOrder >= 0),
        CONSTRAINT CK_ServicePlans_SpecificationsJson CHECK (SpecificationsJson IS NULL OR ISJSON(SpecificationsJson) = 1)
    );
    CREATE INDEX IX_ServicePlans_CategoryId_IsActive ON dbo.ServicePlans(CategoryId, IsActive);
END;
GO

IF OBJECT_ID(N'dbo.PlanPrices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlanPrices
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_PlanPrices PRIMARY KEY,
        ServicePlanId   int NOT NULL,
        BillingCycle    varchar(20) NOT NULL,
        OriginalPrice   decimal(18,2) NOT NULL,
        SalePrice       decimal(18,2) NULL,
        Currency        char(3) NOT NULL CONSTRAINT DF_PlanPrices_Currency DEFAULT ('VND'),
        EffectiveFrom   datetime2(0) NULL,
        EffectiveTo     datetime2(0) NULL,
        IsActive        bit NOT NULL CONSTRAINT DF_PlanPrices_IsActive DEFAULT (1),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_PlanPrices_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT FK_PlanPrices_ServicePlans FOREIGN KEY (ServicePlanId) REFERENCES dbo.ServicePlans(Id),
        CONSTRAINT CK_PlanPrices_BillingCycle CHECK (BillingCycle IN ('Monthly', 'Quarterly', 'Yearly')),
        CONSTRAINT CK_PlanPrices_OriginalPrice CHECK (OriginalPrice >= 0),
        CONSTRAINT CK_PlanPrices_SalePrice CHECK (SalePrice IS NULL OR (SalePrice >= 0 AND SalePrice <= OriginalPrice)),
        CONSTRAINT CK_PlanPrices_EffectiveRange CHECK (EffectiveTo IS NULL OR EffectiveFrom IS NULL OR EffectiveTo > EffectiveFrom),
        CONSTRAINT UQ_PlanPrices_Plan_Cycle_From UNIQUE (ServicePlanId, BillingCycle, EffectiveFrom)
    );
    CREATE INDEX IX_PlanPrices_Plan_Active ON dbo.PlanPrices(ServicePlanId, IsActive);
END;
GO

IF OBJECT_ID(N'dbo.Promotions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Promotions
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Promotions PRIMARY KEY,
        Code            varchar(50) NOT NULL,
        Name            nvarchar(150) NOT NULL,
        Description     nvarchar(1000) NULL,
        DiscountType    varchar(20) NOT NULL,
        DiscountValue   decimal(18,2) NOT NULL,
        StartAt         datetime2(0) NOT NULL,
        EndAt           datetime2(0) NOT NULL,
        UsageLimit      int NULL,
        UsedCount       int NOT NULL CONSTRAINT DF_Promotions_UsedCount DEFAULT (0),
        IsActive        bit NOT NULL CONSTRAINT DF_Promotions_IsActive DEFAULT (1),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_Promotions_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT UQ_Promotions_Code UNIQUE (Code),
        CONSTRAINT CK_Promotions_DiscountType CHECK (DiscountType IN ('Percentage', 'FixedAmount')),
        CONSTRAINT CK_Promotions_DiscountValue CHECK (DiscountValue > 0),
        CONSTRAINT CK_Promotions_Percentage CHECK (DiscountType <> 'Percentage' OR DiscountValue <= 100),
        CONSTRAINT CK_Promotions_DateRange CHECK (EndAt > StartAt),
        CONSTRAINT CK_Promotions_Usage CHECK (UsedCount >= 0 AND (UsageLimit IS NULL OR (UsageLimit > 0 AND UsedCount <= UsageLimit)))
    );
END;
GO

IF OBJECT_ID(N'dbo.PromotionServicePlans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PromotionServicePlans
    (
        PromotionId    int NOT NULL,
        ServicePlanId  int NOT NULL,
        CONSTRAINT PK_PromotionServicePlans PRIMARY KEY (PromotionId, ServicePlanId),
        CONSTRAINT FK_PromotionServicePlans_Promotions FOREIGN KEY (PromotionId) REFERENCES dbo.Promotions(Id) ON DELETE CASCADE,
        CONSTRAINT FK_PromotionServicePlans_ServicePlans FOREIGN KEY (ServicePlanId) REFERENCES dbo.ServicePlans(Id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.NewsCategories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NewsCategories
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_NewsCategories PRIMARY KEY,
        Name            nvarchar(100) NOT NULL,
        Slug            varchar(120) NOT NULL,
        Description     nvarchar(500) NULL,
        IsActive        bit NOT NULL CONSTRAINT DF_NewsCategories_IsActive DEFAULT (1),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_NewsCategories_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_NewsCategories_Slug UNIQUE (Slug)
    );
END;
GO

IF OBJECT_ID(N'dbo.NewsArticles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.NewsArticles
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_NewsArticles PRIMARY KEY,
        CategoryId      int NOT NULL,
        Title           nvarchar(250) NOT NULL,
        Slug            varchar(280) NOT NULL,
        Summary         nvarchar(1000) NULL,
        Content         nvarchar(max) NOT NULL,
        ThumbnailUrl    nvarchar(500) NULL,
        AuthorName      nvarchar(150) NULL,
        PublishedAt     datetime2(0) NULL,
        IsPublished     bit NOT NULL CONSTRAINT DF_NewsArticles_IsPublished DEFAULT (0),
        ViewCount       int NOT NULL CONSTRAINT DF_NewsArticles_ViewCount DEFAULT (0),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_NewsArticles_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT UQ_NewsArticles_Slug UNIQUE (Slug),
        CONSTRAINT FK_NewsArticles_NewsCategories FOREIGN KEY (CategoryId) REFERENCES dbo.NewsCategories(Id),
        CONSTRAINT CK_NewsArticles_ViewCount CHECK (ViewCount >= 0),
        CONSTRAINT CK_NewsArticles_PublishDate CHECK (IsPublished = 0 OR PublishedAt IS NOT NULL)
    );
    CREATE INDEX IX_NewsArticles_Category_Published ON dbo.NewsArticles(CategoryId, IsPublished, PublishedAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.OrderRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderRequests
    (
        Id                      bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderRequests PRIMARY KEY,
        TrackingCode            varchar(30) NOT NULL,
        CustomerName            nvarchar(150) NOT NULL,
        Email                   nvarchar(255) NOT NULL,
        Phone                   varchar(20) NOT NULL,
        CompanyName             nvarchar(200) NULL,
        ServicePlanId           int NOT NULL,
        PlanPriceId             int NOT NULL,
        PromotionCode           varchar(50) NULL,
        PlanNameSnapshot        nvarchar(150) NOT NULL,
        BillingCycleSnapshot    varchar(20) NOT NULL,
        UnitPrice               decimal(18,2) NOT NULL,
        DiscountAmount          decimal(18,2) NOT NULL CONSTRAINT DF_OrderRequests_Discount DEFAULT (0),
        EstimatedAmount         decimal(18,2) NOT NULL,
        Note                    nvarchar(2000) NULL,
        InternalNote            nvarchar(2000) NULL,
        Status                  varchar(20) NOT NULL CONSTRAINT DF_OrderRequests_Status DEFAULT ('New'),
        CreatedAt               datetime2(0) NOT NULL CONSTRAINT DF_OrderRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt               datetime2(0) NULL,
        CONSTRAINT UQ_OrderRequests_TrackingCode UNIQUE (TrackingCode),
        CONSTRAINT FK_OrderRequests_ServicePlans FOREIGN KEY (ServicePlanId) REFERENCES dbo.ServicePlans(Id),
        CONSTRAINT FK_OrderRequests_PlanPrices FOREIGN KEY (PlanPriceId) REFERENCES dbo.PlanPrices(Id),
        CONSTRAINT CK_OrderRequests_BillingCycle CHECK (BillingCycleSnapshot IN ('Monthly', 'Quarterly', 'Yearly')),
        CONSTRAINT CK_OrderRequests_Status CHECK (Status IN ('New', 'Processing', 'Done', 'Rejected')),
        CONSTRAINT CK_OrderRequests_Amounts CHECK (UnitPrice >= 0 AND DiscountAmount >= 0 AND EstimatedAmount >= 0 AND DiscountAmount <= UnitPrice)
    );
    CREATE INDEX IX_OrderRequests_Status_CreatedAt ON dbo.OrderRequests(Status, CreatedAt DESC);
    CREATE INDEX IX_OrderRequests_ServicePlanId ON dbo.OrderRequests(ServicePlanId);
END;
GO

IF OBJECT_ID(N'dbo.AffiliateApplications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AffiliateApplications
    (
        Id                  bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_AffiliateApplications PRIMARY KEY,
        FullName            nvarchar(150) NOT NULL,
        Email               nvarchar(255) NOT NULL,
        Phone               varchar(20) NOT NULL,
        WebsiteOrChannel    nvarchar(500) NULL,
        Note                nvarchar(2000) NULL,
        InternalNote        nvarchar(2000) NULL,
        Status              varchar(20) NOT NULL CONSTRAINT DF_AffiliateApplications_Status DEFAULT ('New'),
        CreatedAt           datetime2(0) NOT NULL CONSTRAINT DF_AffiliateApplications_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt           datetime2(0) NULL,
        CONSTRAINT CK_AffiliateApplications_Status CHECK (Status IN ('New', 'Processing', 'Done', 'Rejected'))
    );
    CREATE INDEX IX_AffiliateApplications_Status_CreatedAt ON dbo.AffiliateApplications(Status, CreatedAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.Testimonials', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Testimonials
    (
        Id              int IDENTITY(1,1) NOT NULL CONSTRAINT PK_Testimonials PRIMARY KEY,
        CustomerName    nvarchar(150) NOT NULL,
        CompanyName     nvarchar(200) NULL,
        Position        nvarchar(100) NULL,
        Content         nvarchar(1000) NOT NULL,
        AvatarUrl       nvarchar(500) NULL,
        LogoUrl         nvarchar(500) NULL,
        Rating          tinyint NOT NULL CONSTRAINT DF_Testimonials_Rating DEFAULT (5),
        DisplayOrder    int NOT NULL CONSTRAINT DF_Testimonials_DisplayOrder DEFAULT (0),
        IsActive        bit NOT NULL CONSTRAINT DF_Testimonials_IsActive DEFAULT (1),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_Testimonials_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT CK_Testimonials_Rating CHECK (Rating BETWEEN 1 AND 5),
        CONSTRAINT CK_Testimonials_DisplayOrder CHECK (DisplayOrder >= 0)
    );
END;
GO

IF OBJECT_ID(N'dbo.ContactRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContactRequests
    (
        Id              bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_ContactRequests PRIMARY KEY,
        FullName        nvarchar(150) NOT NULL,
        Email           nvarchar(255) NOT NULL,
        Phone           varchar(20) NULL,
        Subject         nvarchar(250) NOT NULL,
        Message         nvarchar(3000) NOT NULL,
        Status          varchar(20) NOT NULL CONSTRAINT DF_ContactRequests_Status DEFAULT ('New'),
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_ContactRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       datetime2(0) NULL,
        CONSTRAINT CK_ContactRequests_Status CHECK (Status IN ('New', 'Read', 'Replied'))
    );
    CREATE INDEX IX_ContactRequests_Status_CreatedAt ON dbo.ContactRequests(Status, CreatedAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs
    (
        Id              bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLogs PRIMARY KEY,
        UserId          int NULL,
        Action          nvarchar(100) NOT NULL,
        EntityName      nvarchar(100) NULL,
        EntityId        nvarchar(100) NULL,
        OldValues       nvarchar(max) NULL,
        NewValues       nvarchar(max) NULL,
        IpAddress       varchar(45) NULL,
        CreatedAt       datetime2(0) NOT NULL CONSTRAINT DF_AuditLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AuditLogs_AppUsers FOREIGN KEY (UserId) REFERENCES dbo.AppUsers(Id) ON DELETE SET NULL,
        CONSTRAINT CK_AuditLogs_OldValuesJson CHECK (OldValues IS NULL OR ISJSON(OldValues) = 1),
        CONSTRAINT CK_AuditLogs_NewValuesJson CHECK (NewValues IS NULL OR ISJSON(NewValues) = 1)
    );
    CREATE INDEX IX_AuditLogs_UserId_CreatedAt ON dbo.AuditLogs(UserId, CreatedAt DESC);
    CREATE INDEX IX_AuditLogs_Entity ON dbo.AuditLogs(EntityName, EntityId, CreatedAt DESC);
END;
GO

/* Seed roles */
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = N'Admin')
    INSERT dbo.Roles(Name, Description) VALUES (N'Admin', N'Toàn quyền quản trị hệ thống');

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE Name = N'Editor')
    INSERT dbo.Roles(Name, Description) VALUES (N'Editor', N'Quản lý nội dung và xử lý yêu cầu');
GO

/* Seed service categories */
IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'vps')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'VPS', 'vps', N'Máy chủ ảo hiệu năng cao', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'hosting')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'Hosting', 'hosting', N'Dịch vụ lưu trữ website', 2);

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'domain')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'Domain', 'domain', N'Đăng ký và quản lý tên miền', 3);

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'business-email')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'Email doanh nghiệp', 'business-email', N'Email theo tên miền doanh nghiệp', 4);

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'ssl')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'SSL', 'ssl', N'Chứng chỉ bảo mật website', 5);

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceCategories WHERE Slug = 'ddos-firewall')
    INSERT dbo.ServiceCategories(Name, Slug, Description, DisplayOrder) VALUES (N'Firewall chống DDoS', 'ddos-firewall', N'Giải pháp bảo vệ hạ tầng trước tấn công DDoS', 6);
GO

/* Seed sample plans and prices. Application seed will add demo users with hashed passwords. */
DECLARE @VpsCategoryId int = (SELECT Id FROM dbo.ServiceCategories WHERE Slug = 'vps');
DECLARE @HostingCategoryId int = (SELECT Id FROM dbo.ServiceCategories WHERE Slug = 'hosting');

IF NOT EXISTS (SELECT 1 FROM dbo.ServicePlans WHERE Slug = 'cloud-vps-basic')
BEGIN
    INSERT dbo.ServicePlans
        (CategoryId, Name, Slug, ShortDescription, CpuCores, RamGb, StorageGb, StorageType, BandwidthGb, SpecificationsJson, IsFeatured, DisplayOrder)
    VALUES
        (@VpsCategoryId, N'Cloud VPS Basic', 'cloud-vps-basic', N'Gói VPS phù hợp website và ứng dụng nhỏ', 2, 2, 40, N'NVMe', 2000,
         N'{"IPv4":1,"Backup":"Weekly","Uptime":"99.9%"}', 1, 1);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.ServicePlans WHERE Slug = 'business-hosting')
BEGIN
    INSERT dbo.ServicePlans
        (CategoryId, Name, Slug, ShortDescription, StorageGb, StorageType, BandwidthGb, SpecificationsJson, IsFeatured, DisplayOrder)
    VALUES
        (@HostingCategoryId, N'Business Hosting', 'business-hosting', N'Hosting cho website doanh nghiệp', 20, N'NVMe', 1000,
         N'{"Websites":5,"EmailAccounts":20,"SSL":"Included"}', 1, 2);
END;

DECLARE @VpsBasicId int = (SELECT Id FROM dbo.ServicePlans WHERE Slug = 'cloud-vps-basic');
DECLARE @BusinessHostingId int = (SELECT Id FROM dbo.ServicePlans WHERE Slug = 'business-hosting');

IF NOT EXISTS (SELECT 1 FROM dbo.PlanPrices WHERE ServicePlanId = @VpsBasicId AND BillingCycle = 'Monthly' AND EffectiveFrom IS NULL)
    INSERT dbo.PlanPrices(ServicePlanId, BillingCycle, OriginalPrice, SalePrice) VALUES (@VpsBasicId, 'Monthly', 590000, 490000);

IF NOT EXISTS (SELECT 1 FROM dbo.PlanPrices WHERE ServicePlanId = @VpsBasicId AND BillingCycle = 'Yearly' AND EffectiveFrom IS NULL)
    INSERT dbo.PlanPrices(ServicePlanId, BillingCycle, OriginalPrice, SalePrice) VALUES (@VpsBasicId, 'Yearly', 7080000, 5880000);

IF NOT EXISTS (SELECT 1 FROM dbo.PlanPrices WHERE ServicePlanId = @BusinessHostingId AND BillingCycle = 'Monthly' AND EffectiveFrom IS NULL)
    INSERT dbo.PlanPrices(ServicePlanId, BillingCycle, OriginalPrice, SalePrice) VALUES (@BusinessHostingId, 'Monthly', 199000, 159000);

IF NOT EXISTS (SELECT 1 FROM dbo.PlanPrices WHERE ServicePlanId = @BusinessHostingId AND BillingCycle = 'Yearly' AND EffectiveFrom IS NULL)
    INSERT dbo.PlanPrices(ServicePlanId, BillingCycle, OriginalPrice, SalePrice) VALUES (@BusinessHostingId, 'Yearly', 2388000, 1908000);
GO

PRINT N'CloudServiceDb v1 schema and sample public data are ready.';
PRINT N'Demo Admin/Editor users must be seeded by the application password-hashing service.';
GO
