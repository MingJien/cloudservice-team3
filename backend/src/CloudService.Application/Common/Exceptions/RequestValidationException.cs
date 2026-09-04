namespace CloudService.Application.Common.Exceptions;

public sealed class RequestValidationException : Exception
{
    public RequestValidationException(string field, string message)
        : base("Dữ liệu yêu cầu không hợp lệ.")
    {
        Errors = new Dictionary<string, string[]> { [field] = [message] };
    }

    public RequestValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("Dữ liệu yêu cầu không hợp lệ.")
    {
        ArgumentNullException.ThrowIfNull(errors);
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
