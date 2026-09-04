using CloudService.Application.Common.Interfaces;
using CloudService.Application.Features.Orders.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CloudService.Infrastructure.BackgroundJobs;

/// <summary>
/// Durable, retryable export worker. HTTP chỉ tạo một hàng đợi DB; worker
/// mới đọc dữ liệu và dựng XLSX, nên request không giữ connection/RAM cho
/// đến khi báo cáo lớn hoàn tất.
/// </summary>
public sealed class OrderExportBackgroundService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<OrderExportBackgroundService> logger) : BackgroundService
{
    private const int MaxExportRows = 5000;
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan LeaseTimeout = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan FileRetention = TimeSpan.FromHours(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval, timeProvider);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOneAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Order export worker failed; the next polling cycle will retry.");
            }

            try
            {
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task ProcessOneAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IOrderExportJobRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var orderRepository = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
        var formatter = scope.ServiceProvider.GetRequiredService<IOrderExportFormatter>();
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;

        await jobs.RequeueStaleProcessingAsync(utcNow.Subtract(LeaseTimeout), cancellationToken);
        var expired = await jobs.GetExpiredAsync(utcNow, cancellationToken);
        foreach (var item in expired) item.Expire();
        if (expired.Count > 0) await unitOfWork.SaveChangesAsync(cancellationToken);

        var job = await jobs.GetNextPendingAsync(cancellationToken);
        if (job is null) return;
        if (job.ExpiresAtUtc <= utcNow)
        {
            job.Expire();
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }
        job.MarkProcessing(utcNow);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            // Another API replica claimed this row.
            return;
        }

        try
        {
            var rows = await orderRepository.GetForExportAsync(job.StatusFilter, job.Search, cancellationToken);
            if (rows.Count > MaxExportRows)
            {
                job.Fail($"Kết quả vượt quá {MaxExportRows:N0} dòng. Hãy lọc theo trạng thái hoặc từ khóa rồi xuất lại.", timeProvider.GetUtcNow().UtcDateTime);
                await unitOfWork.SaveChangesAsync(cancellationToken);
                return;
            }
            var export = formatter.Create(rows, timeProvider.GetUtcNow().UtcDateTime);
            job.Complete(
                export.Content,
                export.FileName,
                export.ContentType,
                timeProvider.GetUtcNow().UtcDateTime,
                FileRetention);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            job.Fail(exception.Message, timeProvider.GetUtcNow().UtcDateTime);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
