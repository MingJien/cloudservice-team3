using System.Net;
using System.Net.Mail;
using CloudService.Application.Features.Affiliates.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Notifications;

public sealed class SmtpAffiliateCredentialNotifier(
    IOptions<SmtpOptions> options,
    ILogger<SmtpAffiliateCredentialNotifier> logger) : IAffiliateCredentialNotifier
{
    private readonly SmtpOptions options = options.Value;

    public async Task<string> SendAsync(string email, string fullName, string userName, string temporaryPassword, CancellationToken cancellationToken)
    {
        if (!options.Enabled) return "Disabled";
        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(options.FromEmail, options.FromName),
                Subject = "MekongNode - Tài khoản Affiliate đã được duyệt",
                Body = $"""
                Chào {fullName},

                Hồ sơ Affiliate của bạn đã được duyệt.

                Tên đăng nhập: {userName}
                Mật khẩu tạm thời: {temporaryPassword}
                Partner Portal: {options.PortalUrl}

                Hệ thống sẽ bắt buộc đổi mật khẩu ở lần đăng nhập đầu. Không chuyển tiếp email này và không dùng lại mật khẩu tạm thời cho dịch vụ khác.

                MekongNode Partner Network
                """,
                IsBodyHtml = false
            };
            message.To.Add(new MailAddress(email, fullName));
            using var client = new SmtpClient(options.Host, options.Port)
            {
                EnableSsl = options.EnableSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(options.UserName, options.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };
            await client.SendMailAsync(message, cancellationToken);
            return "Sent";
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Could not deliver affiliate credentials to {EmailDomain}.", email.Split('@').LastOrDefault());
            return "Failed";
        }
    }
}
