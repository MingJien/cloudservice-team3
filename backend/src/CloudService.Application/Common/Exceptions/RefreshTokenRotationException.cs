namespace CloudService.Application.Common.Exceptions;

/// <summary>
/// Raised when two clients attempt to rotate the same refresh token. The
/// caller must discard both session cookies and authenticate again.
/// </summary>
public sealed class RefreshTokenRotationException : Exception
{
    public RefreshTokenRotationException()
        : base("Refresh token đã được sử dụng ở một yêu cầu khác.")
    {
    }
}
