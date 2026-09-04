using System.ComponentModel.DataAnnotations;

namespace CloudService.Infrastructure.Notifications;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";
    public bool Enabled { get; init; }
    [StringLength(255)] public string Host { get; init; } = string.Empty;
    [Range(1, 65535)] public int Port { get; init; } = 587;
    public bool EnableSsl { get; init; } = true;
    [StringLength(255)] public string UserName { get; init; } = string.Empty;
    [StringLength(512)] public string Password { get; init; } = string.Empty;
    [EmailAddress] public string FromEmail { get; init; } = "no-reply@mekongnode.local";
    [StringLength(150)] public string FromName { get; init; } = "MekongNode Partner Network";
    [Url] public string PortalUrl { get; init; } = "http://localhost:3000/affiliate/login";
}
