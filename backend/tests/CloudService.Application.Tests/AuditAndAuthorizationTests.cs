using System.Reflection;
using CloudService.Application.Common.Exceptions;
using CloudService.Application.Common.Models;
using CloudService.Application.Features.AuditLogs;
using CloudService.Application.Features.AuditLogs.Interfaces;
using CloudService.Application.Features.AuditLogs.Models;
using CloudService.Domain.Constants;
using CloudService.WebApi.Controllers;
using Microsoft.AspNetCore.Authorization;
using Moq;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class AuditAndAuthorizationTests
{
    [Fact]
    public async Task Audit_query_rejects_inverted_date_range()
    {
        var service = new AuditLogService(Mock.Of<IAuditLogReadStore>());
        var from = new DateTime(2026, 8, 5, 12, 0, 0, DateTimeKind.Utc);

        await Assert.ThrowsAsync<RequestValidationException>(() => service.GetAsync(
            new PagedRequest(),
            new AuditLogFilter(FromUtc: from, ToUtc: from.AddMinutes(-1)),
            CancellationToken.None));
    }

    [Fact]
    public void Audit_logs_controller_requires_admin_role()
    {
        var attribute = typeof(AuditLogsController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(RoleNames.Admin, attribute.Roles);
    }

    [Fact]
    public void Change_password_endpoint_allows_only_admin_or_editor()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.ChangePassword));
        var attribute = method!.GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attribute);
        Assert.Equal(RoleNames.AdminOrEditor, attribute.Roles);
    }
}
