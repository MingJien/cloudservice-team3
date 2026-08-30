using CloudService.Application.Common.Interfaces;
using CloudService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudService.Infrastructure.Persistence;

public sealed class IdempotencyStore(ApplicationDbContext dbContext) : IIdempotencyStore
{
    public Task<ApiIdempotencyRecord?> FindAsync(string scope, string keyHash, CancellationToken cancellationToken) =>
        dbContext.ApiIdempotencyRecords.AsNoTracking().SingleOrDefaultAsync(
            item => item.Scope == scope && item.KeyHash == keyHash,
            cancellationToken);

    public void Add(ApiIdempotencyRecord record) => dbContext.ApiIdempotencyRecords.Add(record);
}
