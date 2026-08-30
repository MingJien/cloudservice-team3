using CloudService.Application.Features.Affiliates.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CloudService.Infrastructure.BackgroundJobs;

public sealed class AffiliateMaintenanceBackgroundService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<AffiliateMaintenanceBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Running hourly makes the 30-day release timely while monthly tier
        // evaluation remains idempotent inside the application service.
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1), timeProvider);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<IAffiliatePortalService>().RunMaintenanceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Affiliate ledger maintenance failed; the next idempotent cycle will retry."); }

            try { await timer.WaitForNextTickAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }
}
