using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Interfaces;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class ApplicationUnitOfWork(ApplicationDbContext dbContext) : IUnitOfWork
{
    public void AddAuditLog(AuditLog auditLog) => dbContext.AuditLogs.Add(auditLog);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.Entries.Any(entry => entry.Entity is AffiliateApplication))
        {
            var message = exception.InnerException?.Message ?? exception.Message;
            var email = message.Contains("UQ_AffiliateApplications_Email", StringComparison.OrdinalIgnoreCase);
            var phone = message.Contains("UQ_AffiliateApplications_Phone", StringComparison.OrdinalIgnoreCase);
            var website = message.Contains("UQ_AffiliateApplications_WebsiteOrChannel", StringComparison.OrdinalIgnoreCase);
            if (email || phone || website)
                throw AffiliateDuplicateException.From(email, phone, website);
            throw;
        }
        catch (DbUpdateException exception) when (exception.Entries.Any(entry => entry.Entity is AffiliateReferral)
            && (exception.InnerException?.Message ?? exception.Message).Contains("UQ_AffiliateReferrals_VisitId", StringComparison.OrdinalIgnoreCase))
        {
            // Referral visits are intentionally unique. A double click or two tabs
            // must converge on one attribution row, not become an HTTP 500.
            dbContext.ChangeTracker.Clear();
            throw new AffiliateReferralReservationException();
        }
    }

    public async Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default)
    {
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var result = await operation(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return result;
            }
            catch (DbUpdateException exception) when (exception.Entries.Any(entry => entry.Entity is ApiIdempotencyRecord))
            {
                await transaction.RollbackAsync(cancellationToken);
                dbContext.ChangeTracker.Clear();
                throw new IdempotencyReservationException();
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                dbContext.ChangeTracker.Clear();
                throw;
            }
        });
    }
}
