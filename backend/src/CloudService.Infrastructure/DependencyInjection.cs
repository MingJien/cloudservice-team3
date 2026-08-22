using System.Text;
using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Orders.Commands;
using CloudService.Application.Features.AuditLogs;
using CloudService.Application.Features.AuditLogs.Interfaces;
using CloudService.Application.Features.Affiliates;
using CloudService.Application.Features.Affiliates.Interfaces;
using CloudService.Application.Features.Auth;
using CloudService.Application.Features.Auth.Interfaces;
using CloudService.Application.Features.Branding;
using CloudService.Application.Features.Branding.Interfaces;
using CloudService.Application.Features.Content;
using CloudService.Application.Features.Content.Interfaces;
using CloudService.Application.Features.Dashboard;
using CloudService.Application.Features.Dashboard.Interfaces;
using CloudService.Application.Features.Orders;
using CloudService.Application.Features.Orders.Interfaces;
using CloudService.Application.Features.Pricing;
using CloudService.Application.Features.Pricing.Interfaces;
using CloudService.Application.Features.Pricing.Strategies;
using CloudService.Application.Features.Recommendations;
using CloudService.Application.Features.Recommendations.Interfaces;
using CloudService.Application.Features.Recommendations.Rules;
using CloudService.Application.Features.Services;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Infrastructure.Authentication;
using CloudService.Infrastructure.Excel;
using CloudService.Infrastructure.Persistence;
using CloudService.Infrastructure.QRCode;
using CloudService.Infrastructure.Notifications;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CloudService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(CreateOrderCommand).Assembly));
        services.AddMemoryCache();
        
        services.AddHttpContextAccessor();
        services.AddScoped<AuditSaveChangesInterceptor>();
        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) => options
            // Required FKs are intentionally retained for data integrity. Historical order queries
            // explicitly ignore catalog filters so a soft-deleted price never hides an old order.
            .ConfigureWarnings(warnings => warnings.Ignore(CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning))
            .UseSqlServer(
                connectionString,
                sqlServer => sqlServer.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null))
            .AddInterceptors(serviceProvider.GetRequiredService<AuditSaveChangesInterceptor>()));
        services.AddOptions<AuditRetentionOptions>()
            .Bind(configuration.GetSection(AuditRetentionOptions.SectionName))
            .Validate(options => options.RetentionMonths is >= 1 and <= 120, "RetentionMonths must be between 1 and 120.")
            .Validate(options => options.LocalRunHour is >= 0 and <= 23, "LocalRunHour must be between 0 and 23.")
            .ValidateOnStart();
        services.AddHostedService<AuditLogRetentionService>();
        services.AddOptions<TelegramOptions>()
            .Bind(configuration.GetSection(TelegramOptions.SectionName))
            .ValidateDataAnnotations()
            .Validate(options => !options.Enabled || (!string.IsNullOrWhiteSpace(options.BotToken) && !string.IsNullOrWhiteSpace(options.ChatId)),
                "Telegram BotToken and ChatId are required when Telegram is enabled.")
            .ValidateOnStart();
        services.AddHttpClient<TelegramNotificationSender>(client =>
        {
            client.BaseAddress = new Uri("https://api.telegram.org/");
            client.Timeout = TimeSpan.FromSeconds(10);
        }).AddStandardResilienceHandler();
        services.AddHostedService<OutboxProcessorBackgroundService>();
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .Validate(options => !options.Secret.StartsWith("CHANGE_ME", StringComparison.OrdinalIgnoreCase),
                "JWT secret must be supplied through configuration or an environment variable.")
            .ValidateOnStart();

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration is missing.");
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                    ClockSkew = TimeSpan.FromSeconds(30)
                };
            });
        services.AddAuthorization();

        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddSingleton<ITokenService, JwtTokenService>();
        services.AddScoped<IAuthStore, AuthStore>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IBrandingRepository, BrandingRepository>();
        services.AddScoped<IBrandingService, BrandingService>();
        services.AddScoped<IPlanCatalogReadStore, PlanCatalogReadStore>();
        services.AddScoped<IPricingService, PricingService>();
        services.AddScoped<IPlanComparisonService, PlanComparisonService>();
        services.AddSingleton<IPromotionDiscountStrategy, PercentageDiscountStrategy>();
        services.AddSingleton<IPromotionDiscountStrategy, FixedAmountDiscountStrategy>();
        services.AddScoped<IServicePlanRecommendationService, ServicePlanRecommendationService>();
        services.AddSingleton<IRecommendationRule, BudgetRecommendationRule>();
        services.AddSingleton<IRecommendationRule, CapacityRecommendationRule>();
        services.AddSingleton<IRecommendationRule, TrafficRecommendationRule>();
        services.AddSingleton<IRecommendationRule, PurposeRecommendationRule>();
        services.AddScoped<IAuditLogReadStore, AuditLogReadStore>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IUnitOfWork, ApplicationUnitOfWork>();
        services.AddScoped<IIdempotencyStore, IdempotencyStore>();
        services.AddScoped<IOutboxWriter, OutboxWriter>();
        services.AddScoped<IServiceCatalogRepository, ServiceCatalogRepository>();
        services.AddScoped<IServiceCatalogService, ServiceCatalogService>();
        services.AddSingleton<IQrCodeGenerator, SvgQrCodeGenerator>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderRequestFactory, OrderRequestFactory>();
        services.AddSingleton<IOrderExportFormatter, OrderXlsxExportFormatter>();
        services.AddScoped<IAffiliateRepository, AffiliateRepository>();
        services.AddScoped<IAffiliateService, AffiliateService>();
        services.AddScoped<IContentRepository, ContentRepository>();
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<DatabaseSeeder>();
        return services;
    }
}
