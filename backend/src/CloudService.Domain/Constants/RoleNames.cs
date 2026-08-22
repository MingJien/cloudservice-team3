namespace CloudService.Domain.Constants;

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public const string AdminOrEditor = Admin + "," + Editor;
}
