using CloudService.Domain.Common;

namespace CloudService.Domain.Entities;

public sealed class AppUser : AuditableEntity
{
    private AppUser()
    {
    }

    public AppUser(string userName, string fullName, string email, string passwordHash, int roleId)
    {
        UserName = Guard.Required(userName, nameof(userName));
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = Guard.Required(email, nameof(email));
        PasswordHash = Guard.Required(passwordHash, nameof(passwordHash));
        RoleId = roleId > 0 ? roleId : throw new ArgumentOutOfRangeException(nameof(roleId));
    }

    public string UserName { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string? AvatarUrl { get; private set; }
    public int RoleId { get; private set; }
    public bool IsActive { get; private set; } = true;
    public bool MustChangePassword { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public Role Role { get; private set; } = null!;
    public ICollection<RefreshToken> RefreshTokens { get; private set; } = new List<RefreshToken>();
    public ICollection<AuditLog> AuditLogs { get; private set; } = new List<AuditLog>();

    public void RecordSuccessfulLogin(DateTime utcNow)
    {
        LastLoginAt = utcNow;
        MarkUpdated(utcNow);
    }

    public void ChangePasswordHash(string passwordHash, DateTime utcNow)
    {
        PasswordHash = Guard.Required(passwordHash, nameof(passwordHash));
        MustChangePassword = false;
        MarkUpdated(utcNow);
    }

    public void RequirePasswordChange() => MustChangePassword = true;

    public void Deactivate(DateTime utcNow)
    {
        // Retiring a classroom fixture must invalidate its login path without
        // deleting the audit trail that explains historical orders and payouts.
        // Production account administration follows the same soft-disable rule.
        if (!IsActive) return;
        IsActive = false;
        MarkUpdated(utcNow);
    }

    public void UpdateAvatarUrl(string? avatarUrl, DateTime utcNow)
    {
        AvatarUrl = avatarUrl;
        MarkUpdated(utcNow);
    }

    public void UpdateProfile(string fullName, string email, DateTime utcNow)
    {
        FullName = Guard.Required(fullName, nameof(fullName));
        Email = Guard.Required(email, nameof(email));
        MarkUpdated(utcNow);
    }
}
