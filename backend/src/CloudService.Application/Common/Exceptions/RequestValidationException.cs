namespace CloudService.Application.Common.Exceptions;

public sealed class RequestValidationException : Exception
{
    public RequestValidationException(string field, string message)
        : base("Dữ liệu yêu cầu không hợp lệ.")
    {
        Errors = new Dictionary<string, string[]> { [field] = [message] };
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
