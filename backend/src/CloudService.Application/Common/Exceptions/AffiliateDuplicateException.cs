namespace CloudService.Application.Common.Exceptions;

public sealed class AffiliateDuplicateException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("Một hoặc nhiều thông tin định danh đã được dùng để đăng ký Affiliate.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;

    public static AffiliateDuplicateException From(bool emailExists, bool phoneExists, bool websiteExists)
    {
        var errors = new Dictionary<string, string[]>();
        if (emailExists) errors["email"] = ["Email này đã có hồ sơ Affiliate. Vui lòng không gửi lại."];
        if (phoneExists) errors["phone"] = ["Số điện thoại này đã có hồ sơ Affiliate. Vui lòng không gửi lại."];
        if (websiteExists) errors["websiteOrChannel"] = ["Website hoặc kênh này đã được đăng ký cho một hồ sơ Affiliate khác."];
        return new AffiliateDuplicateException(errors);
    }
}
