using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Persistence;

public sealed class AuditLogRetentionService(
    IServiceScopeFactory scopeFactory,
    IOptions<AuditRetentionOptions> options,
    TimeProvider timeProvider,
    ILogger<AuditLogRetentionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var settings = options.Value;
        if (!settings.Enabled)
        {
            logger.LogInformation("Audit-log retention service is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = DelayUntilNextRun(settings.LocalRunHour);
            logger.LogInformation("Next audit-log cleanup is scheduled in {Delay}.", delay);
            await Task.Delay(delay, timeProvider, stoppingToken);

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var cutoff = timeProvider.GetUtcNow().UtcDateTime.AddMonths(-settings.RetentionMonths);
                var deleted = await dbContext.AuditLogs
                    .Where(log => log.CreatedAt < cutoff)
                    .ExecuteDeleteAsync(stoppingToken);
                logger.LogInformation("Deleted {Count} audit logs older than {CutoffUtc}.", deleted, cutoff);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Audit-log cleanup failed; the service will retry on the next schedule.");
            }
        }
    }

    private TimeSpan DelayUntilNextRun(int hour)
    {
        var now = timeProvider.GetLocalNow();
        var next = new DateTimeOffset(now.Year, now.Month, now.Day, hour, 0, 0, now.Offset);
        if (next <= now) next = next.AddDays(1);
        return next - now;
    }
}
