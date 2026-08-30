namespace CloudService.Application.Common.Exceptions;

public sealed class InvalidCredentialsException : Exception
{
    public InvalidCredentialsException()
        : base("Tên đăng nhập hoặc mật khẩu không đúng.")
    {
    }
}
