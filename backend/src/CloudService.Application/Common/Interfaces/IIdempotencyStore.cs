using CloudService.Domain.Entities;

namespace CloudService.Application.Common.Interfaces;

public interface IIdempotencyStore
{
    Task<ApiIdempotencyRecord?> FindAsync(string scope, string keyHash, CancellationToken cancellationToken);
    void Add(ApiIdempotencyRecord record);
}
