using CloudService.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            RefreshTokenRotationException => (StatusCodes.Status401Unauthorized, "Phiên đăng nhập đã được sử dụng ở một yêu cầu khác."),
            RequestValidationException => (StatusCodes.Status400BadRequest, "Dữ liệu yêu cầu không hợp lệ."),
            AffiliateDuplicateException => (StatusCodes.Status409Conflict, "Hồ sơ Affiliate đã tồn tại."),
            ConflictException => (StatusCodes.Status409Conflict, "Yêu cầu xung đột với dữ liệu hiện tại."),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Dữ liệu vừa được người khác cập nhật."),
            ResourceNotFoundException => (StatusCodes.Status404NotFound, "Không tìm thấy dữ liệu."),
            _ => (StatusCodes.Status500InternalServerError, "Đã xảy ra lỗi máy chủ.")
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled request exception. TraceId: {TraceId}", httpContext.TraceIdentifier);
        }

        httpContext.Response.StatusCode = status;
        var problem = exception switch
        {
            RequestValidationException validationException => new ValidationProblemDetails(validationException.Errors.ToDictionary(item => item.Key, item => item.Value)),
            AffiliateDuplicateException duplicateException => new ValidationProblemDetails(duplicateException.Errors.ToDictionary(item => item.Key, item => item.Value)),
            _ => new ProblemDetails()
        };
        problem.Status = status;
        problem.Title = title;
        problem.Detail = exception is DbUpdateConcurrencyException
            ? "Bản ghi đã thay đổi sau khi bạn mở biểu mẫu. Hãy tải lại dữ liệu rồi thử lại để tránh ghi đè thay đổi của quản trị viên khác."
            : status == StatusCodes.Status500InternalServerError ? null : exception.Message;
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
