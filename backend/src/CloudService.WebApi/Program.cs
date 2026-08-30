using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using CloudService.Infrastructure;
using CloudService.Infrastructure.Persistence;
using CloudService.WebApi.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var seedDemoOnly = args.Any(argument => string.Equals(argument, "--seed-demo", StringComparison.OrdinalIgnoreCase));
var jwtSecret = builder.Configuration["Jwt:Secret"];
var demoUsersEnabled = builder.Configuration.GetValue<bool>("Seed:DemoUsers:Enabled");
var demoPasswordResetEnabled = builder.Configuration.GetValue<bool>("Seed:DemoUsers:ResetPasswordOnStartup");
if (!builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(jwtSecret) ||
        jwtSecret.StartsWith("CHANGE_ME", StringComparison.OrdinalIgnoreCase) ||
        jwtSecret.Contains("Local-Jwt-Secret", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException(
            "Production requires a strong Jwt:Secret supplied by secret storage or an environment variable.");
    }

    if (demoUsersEnabled || demoPasswordResetEnabled)
    {
        throw new InvalidOperationException(
            "Demo users and automatic demo-password reset must be disabled outside Development.");
    }
}

if (seedDemoOnly && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException("The --seed-demo command is restricted to the Development environment.");
}

// Console + Debug work consistently in Visual Studio and containers without
// requiring permission to write to the Windows Event Log.
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
// Telegram requires the bot token in the request path. The default
// HttpClientFactory diagnostics logger would therefore echo that secret into
// container logs at Information level. Keep the worker's own operational
// logs, but disable the transport category so credentials can never leak via
// request/response tracing.
builder.Logging.AddFilter(
    "System.Net.Http.HttpClient.TelegramNotificationSender",
    Microsoft.Extensions.Logging.LogLevel.None);

builder.Services
    .AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problem = new ValidationProblemDetails(context.ModelState)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Dữ liệu yêu cầu không hợp lệ.",
                Type = "https://httpstatuses.com/400",
                Instance = context.HttpContext.Request.Path
            };
            problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            return new BadRequestObjectResult(problem);
        };
    });
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    var bearerScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Nhập JWT access token theo dạng: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };
    options.AddSecurityDefinition("Bearer", bearerScheme);
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document, null)] = []
    });
});
builder.Services.AddInfrastructure(builder.Configuration);

var authPermitLimit = builder.Configuration.GetValue("AuthRateLimit:PermitLimit", 10);
var authWindowSeconds = builder.Configuration.GetValue("AuthRateLimit:WindowSeconds", 60);
var orderPermitLimit = builder.Configuration.GetValue("OrderRateLimit:PermitLimit", 3);
var orderWindowSeconds = builder.Configuration.GetValue("OrderRateLimit:WindowSeconds", 300);
var referralPermitLimit = builder.Configuration.GetValue("AffiliateReferralRateLimit:PermitLimit", 30);
var referralWindowSeconds = builder.Configuration.GetValue("AffiliateReferralRateLimit:WindowSeconds", 60);
var testimonialPermitLimit = builder.Configuration.GetValue("TestimonialRateLimit:PermitLimit", 3);
var testimonialWindowSeconds = builder.Configuration.GetValue("TestimonialRateLimit:WindowSeconds", 600);
var contactPermitLimit = builder.Configuration.GetValue("ContactRateLimit:PermitLimit", 5);
var contactWindowSeconds = builder.Configuration.GetValue("ContactRateLimit:WindowSeconds", 600);
var affiliateApplicationPermitLimit = builder.Configuration.GetValue("AffiliateApplicationRateLimit:PermitLimit", 3);
var affiliateApplicationWindowSeconds = builder.Configuration.GetValue("AffiliateApplicationRateLimit:WindowSeconds", 600);
var affiliateTrackingPermitLimit = builder.Configuration.GetValue("AffiliateTrackingRateLimit:PermitLimit", 30);
var affiliateTrackingWindowSeconds = builder.Configuration.GetValue("AffiliateTrackingRateLimit:WindowSeconds", 300);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = authPermitLimit,
            Window = TimeSpan.FromSeconds(authWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("order-create", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = orderPermitLimit,
            Window = TimeSpan.FromSeconds(orderWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("affiliate-referral", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = referralPermitLimit,
            Window = TimeSpan.FromSeconds(referralWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("testimonial-submit", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = testimonialPermitLimit,
            Window = TimeSpan.FromSeconds(testimonialWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("contact-submit", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = contactPermitLimit,
            Window = TimeSpan.FromSeconds(contactWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("affiliate-application", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = affiliateApplicationPermitLimit,
            Window = TimeSpan.FromSeconds(affiliateApplicationWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("affiliate-tracking", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = affiliateTrackingPermitLimit,
            Window = TimeSpan.FromSeconds(affiliateTrackingWindowSeconds),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        var isOrderRequest = context.HttpContext.Request.Path.StartsWithSegments("/api/order-requests");
        var isTestimonialSubmission = context.HttpContext.Request.Path.StartsWithSegments("/api/testimonials/submissions");
        var isContactSubmission = context.HttpContext.Request.Path.StartsWithSegments("/api/contact-requests")
            && HttpMethods.IsPost(context.HttpContext.Request.Method);
        var isAffiliateApplication = context.HttpContext.Request.Path.StartsWithSegments("/api/affiliate-applications")
            && HttpMethods.IsPost(context.HttpContext.Request.Method);
        var retryAfter = isOrderRequest
            ? orderWindowSeconds
            : isTestimonialSubmission
                ? testimonialWindowSeconds
                : isContactSubmission
                    ? contactWindowSeconds
                    : isAffiliateApplication ? affiliateApplicationWindowSeconds : authWindowSeconds;
        context.HttpContext.Response.Headers.RetryAfter = retryAfter.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Quá nhiều yêu cầu.",
            Detail = isOrderRequest
                ? "Mỗi địa chỉ IP chỉ được gửi tối đa 3 yêu cầu đặt dịch vụ trong 5 phút. Vui lòng chờ rồi thử lại."
                : isTestimonialSubmission
                    ? "Bạn đã gửi quá nhiều đánh giá trong thời gian ngắn. Vui lòng chờ rồi thử lại."
                    : "Vui lòng chờ trước khi thử lại.",
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        await context.HttpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
    };
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var value in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
        if (System.Net.IPAddress.TryParse(value, out var address)) options.KnownProxies.Add(address);
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:3000"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .WithHeaders("Accept", "Authorization", "Content-Type", "Idempotency-Key", "If-Match")
            .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .SetPreflightMaxAge(TimeSpan.FromHours(1));
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseForwardedHeaders();
app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});
app.UseStaticFiles();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    check = "Liveness",
    service = "CloudService.WebApi",
    utcTime = DateTime.UtcNow
}));
app.MapGet("/health/ready", async (ApplicationDbContext dbContext, CancellationToken cancellationToken) =>
{
    var databaseReady = await dbContext.Database.CanConnectAsync(cancellationToken);
    return databaseReady
        ? Results.Ok(new
        {
            status = "Healthy",
            check = "Readiness",
            database = "Connected",
            service = "CloudService.WebApi",
            utcTime = DateTime.UtcNow
        })
        : Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Dịch vụ chưa sẵn sàng.",
            detail: "API đang hoạt động nhưng chưa kết nối được SQL Server.");
});
app.MapControllers();

if (app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup") ||
    app.Configuration.GetValue<bool>("Seed:DemoUsers:Enabled") ||
    app.Configuration.GetValue<bool>("Seed:DemoContent:Enabled"))
{
    await using var scope = app.Services.CreateAsyncScope();
    if (app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup"))
    {
        await scope.ServiceProvider.GetRequiredService<ApplicationDbContext>().Database.MigrateAsync();
    }

    await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedDemoUsersAsync();
    await scope.ServiceProvider.GetRequiredService<DatabaseSeeder>().SeedDemoContentAsync();
}

// The demo overlay uses this short-lived command to provision classroom data
// without weakening the long-running Production process: the normal API still
// starts with demo seeding disabled and the guard above remains effective.
if (seedDemoOnly)
{
    return;
}

await app.RunAsync();

public partial class Program;
