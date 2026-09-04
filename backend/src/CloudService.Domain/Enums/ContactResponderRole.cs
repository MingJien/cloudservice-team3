namespace CloudService.Domain.Enums;

/// <summary>
/// Captures the public identity used when a staff member replies. This is stored
/// with the reply so a later role change does not silently rewrite its authorship.
/// </summary>
public enum ContactResponderRole
{
    Admin = 1,
    Editor = 2
}
