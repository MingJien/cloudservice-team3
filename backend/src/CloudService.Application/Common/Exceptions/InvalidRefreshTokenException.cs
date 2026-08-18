namespace CloudService.Application.Common.Exceptions;

public sealed class InvalidRefreshTokenException : Exception
{
    public InvalidRefreshTokenException()
        : base("Refresh token không hợp lệ hoặc đã hết hạn.")
    {
    }
}
