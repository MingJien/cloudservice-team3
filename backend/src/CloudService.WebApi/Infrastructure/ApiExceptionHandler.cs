using CloudService.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace CloudService.WebApi.Infrastructure;

public sealed class ApiExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            InvalidCredentialsException => (StatusCodes.Status401Unauthorized, "Không thể xác thực."),
            InvalidRefreshTokenException => (StatusCodes.Status401Unauthorized, "Không thể làm mới phiên đăng nhập."),
            RequestValidationException => (StatusCodes.Status400BadRequest, "Dữ liệu yêu cầu không hợp lệ."),
            _ => (StatusCodes.Status500InternalServerError, "Đã xảy ra lỗi máy chủ.")
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled request exception. TraceId: {TraceId}", httpContext.TraceIdentifier);
        }

        httpContext.Response.StatusCode = status;
        var problem = exception is RequestValidationException validationException
            ? new ValidationProblemDetails(validationException.Errors.ToDictionary(item => item.Key, item => item.Value))
            : new ProblemDetails();
        problem.Status = status;
        problem.Title = title;
        problem.Detail = status == StatusCodes.Status500InternalServerError ? null : exception.Message;
        problem.Instance = httpContext.Request.Path;
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
