namespace CloudService.Domain.Entities;

public sealed class ApiIdempotencyRecord
{
    private ApiIdempotencyRecord()
    {
    }

    public ApiIdempotencyRecord(string scope, string keyHash, string requestHash, DateTime expiresAtUtc)
    {
        Id = Guid.NewGuid();
        Scope = scope;
        KeyHash = keyHash;
        RequestHash = requestHash;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Scope { get; private set; } = string.Empty;
    public string KeyHash { get; private set; } = string.Empty;
    public string RequestHash { get; private set; } = string.Empty;
    public string? ResponseJson { get; private set; }
    public int? StatusCode { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }

    public void Complete(string responseJson, int statusCode, DateTime utcNow)
    {
        ResponseJson = string.IsNullOrWhiteSpace(responseJson) ? throw new ArgumentException("Response không được rỗng.", nameof(responseJson)) : responseJson;
        StatusCode = statusCode;
        CompletedAtUtc = utcNow;
    }
}
