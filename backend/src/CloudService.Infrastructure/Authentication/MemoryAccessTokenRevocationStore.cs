using System.Collections.Concurrent;
using CloudService.Application.Features.Auth.Interfaces;

namespace CloudService.Infrastructure.Authentication;

/// <summary>
/// Local JTI blocklist used to close the logout window immediately. A
/// multi-replica deployment should bind this interface to Redis so revocations
/// are shared across API instances.
/// </summary>
public sealed class MemoryAccessTokenRevocationStore : IAccessTokenRevocationStore
{
    private readonly ConcurrentDictionary<string, DateTime> revoked = new(StringComparer.Ordinal);

    public bool IsRevoked(string jwtId, DateTime utcNow)
    {
        if (!revoked.TryGetValue(jwtId, out var expiresAt)) return false;
        if (expiresAt > utcNow) return true;
        revoked.TryRemove(jwtId, out _);
        return false;
    }

    public void Revoke(string jwtId, DateTime expiresAtUtc)
    {
        if (!string.IsNullOrWhiteSpace(jwtId) && expiresAtUtc > DateTime.UtcNow)
            revoked[jwtId] = expiresAtUtc;
    }
}
