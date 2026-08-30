using CloudService.Domain.Enums;
using CloudService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Notifications;

public sealed class OutboxProcessorBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<TelegramOptions> options,
    TimeProvider timeProvider,
    ILogger<OutboxProcessorBackgroundService> logger) : BackgroundService
{
    private readonly TelegramOptions options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogWarning(
                "Telegram notification delivery is disabled. Order events remain safely queued in OutboxMessages until Telegram:Enabled, BotToken and ChatId are configured.");
        }
        else
        {
            logger.LogInformation("Telegram outbox delivery enabled; QR links use {PublicBaseUrl}.", options.PublicBaseUrl);
            if (!Uri.TryCreate(options.PublicBaseUrl, UriKind.Absolute, out var publicUri) ||
                publicUri.Scheme != Uri.UriSchemeHttps)
            {
                logger.LogWarning(
                    "Telegram:PublicBaseUrl is not HTTPS. QR can be generated, but a phone cannot normally open localhost or a private development address.");
            }
        }

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(options.PollIntervalSeconds), timeProvider);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (options.Enabled) await ProcessBatchAsync(stoppingToken);
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Unexpected outbox worker failure; the next polling cycle will retry.");
            }
        }
    }

    private async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var sender = scope.ServiceProvider.GetRequiredService<TelegramNotificationSender>();
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var lockId = Guid.NewGuid();

        var messages = await dbContext.OutboxMessages
            .Where(message =>
                (message.Status == OutboxMessageStatus.Pending || message.Status == OutboxMessageStatus.Processing)
                && message.NextAttemptOnUtc <= utcNow
                && (message.LockedUntilUtc == null || message.LockedUntilUtc <= utcNow))
            .OrderBy(message => message.OccurredOnUtc)
            .Take(options.BatchSize)
            .ToArrayAsync(cancellationToken);
        if (messages.Length == 0)
        {
            await CleanupAsync(dbContext, utcNow, cancellationToken);
            return;
        }

        foreach (var message in messages) message.Claim(lockId, utcNow.AddSeconds(options.LeaseSeconds));
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            logger.LogDebug("Another instance claimed this outbox batch first.");
            return;
        }

        foreach (var message in messages)
        {
            try
            {
                await sender.SendAsync(message.Type, message.Payload, cancellationToken);
                message.MarkProcessed(timeProvider.GetUtcNow().UtcDateTime);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                var delay = RetryDelay(message.AttemptCount);
                message.MarkFailed(exception.Message, timeProvider.GetUtcNow().UtcDateTime.Add(delay), options.MaxAttempts);
                logger.LogWarning(exception, "Outbox message {MessageId} failed on attempt {Attempt}; next status is {Status}.", message.Id, message.AttemptCount, message.Status);
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task CleanupAsync(ApplicationDbContext dbContext, DateTime utcNow, CancellationToken cancellationToken)
    {
        await dbContext.OutboxMessages
            .Where(message => message.Status == OutboxMessageStatus.Processed && message.ProcessedOnUtc < utcNow.AddDays(-7))
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.ApiIdempotencyRecords
            .Where(record => record.ExpiresAtUtc < utcNow)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private static TimeSpan RetryDelay(int currentAttemptCount)
    {
        var exponentialSeconds = Math.Min(3600, Math.Pow(2, currentAttemptCount + 1) * 5);
        return TimeSpan.FromSeconds(exponentialSeconds + Random.Shared.Next(0, 6));
    }
}
