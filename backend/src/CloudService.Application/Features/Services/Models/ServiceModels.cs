using System.ComponentModel.DataAnnotations;
using CloudService.Application.Common.Models;
using CloudService.Domain.Enums;

namespace CloudService.Application.Features.Services.Models;

public sealed record ServiceCategoryItem(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? Icon,
    int DisplayOrder,
    bool IsActive,
    bool IsDeleted,
    int ActivePlanCount,
    int SellablePlanCount,
    int TotalPlanCount);

public sealed record PlanPriceItem(
    int Id,
    BillingCycle BillingCycle,
    decimal OriginalPrice,
    decimal? SalePrice,
    decimal EffectivePrice,
    string Currency,
    DateTime? EffectiveFrom,
    DateTime? EffectiveTo,
    bool IsActive,
    bool IsDeleted,
    string? RowVersion = null);

public sealed record ServicePlanItem(
    int Id,
    int CategoryId,
    string CategoryName,
    string CategorySlug,
    string Name,
    string Slug,
    string? ShortDescription,
    string? Description,
    int? CpuCores,
    decimal? RamGb,
    int? StorageGb,
    string? StorageType,
    int? BandwidthGb,
    string? SpecificationsJson,
    string? QrTargetUrl,
    string? QrCodePath,
    DateTime? QrGeneratedAt,
    bool IsFeatured,
    int DisplayOrder,
    bool IsActive,
    bool IsDeleted,
    IReadOnlyCollection<PlanPriceItem> Prices);

public sealed record PromotionItem(
    int Id,
    string Code,
    string Name,
    string? Description,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTime StartAt,
    DateTime EndAt,
    int? UsageLimit,
    int UsedCount,
    bool IsActive,
    IReadOnlyCollection<int> ServicePlanIds,
    string? RowVersion = null);

public sealed record QrCodeResult(int ServicePlanId, string TargetUrl, string DataUrl, DateTime GeneratedAt);
public sealed record CategoryDisableImpact(int CategoryId, string CategoryName, int ActivePlanCount, int TotalPlanCount);

public sealed record EntityStatusRequest(bool IsActive);

public sealed class ServiceCategoryRequest
{
    [Required(ErrorMessage = "Tên danh mục là bắt buộc."), StringLength(100, ErrorMessage = "Tên danh mục tối đa 100 ký tự.")] public string Name { get; init; } = string.Empty;
    [Required(ErrorMessage = "Slug danh mục là bắt buộc."), RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug chỉ gồm chữ thường, số và dấu gạch ngang."), StringLength(150, ErrorMessage = "Slug tối đa 150 ký tự.")] public string Slug { get; init; } = string.Empty;
    [StringLength(500, ErrorMessage = "Mô tả danh mục tối đa 500 ký tự.")] public string? Description { get; init; }
    [RegularExpression("^(server|cloud|globe|mail|shield|database|certificate|zap)$", ErrorMessage = "IconKey phải được chọn từ danh sách biểu tượng hỗ trợ.")] public string? Icon { get; init; }
    [Range(0, int.MaxValue, ErrorMessage = "Thứ tự hiển thị không được âm.")] public int DisplayOrder { get; init; }
}

public sealed class ServicePlanRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Vui lòng chọn danh mục dịch vụ.")] public int CategoryId { get; init; }
    [Required(ErrorMessage = "Tên gói dịch vụ là bắt buộc."), StringLength(150, ErrorMessage = "Tên gói tối đa 150 ký tự.")] public string Name { get; init; } = string.Empty;
    [Required(ErrorMessage = "Slug gói dịch vụ là bắt buộc."), RegularExpression("^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug chỉ gồm chữ thường, số và dấu gạch ngang."), StringLength(180, ErrorMessage = "Slug tối đa 180 ký tự.")] public string Slug { get; init; } = string.Empty;
    [StringLength(500, ErrorMessage = "Mô tả ngắn tối đa 500 ký tự.")] public string? ShortDescription { get; init; }
    public string? Description { get; init; }
    [Range(1, 256, ErrorMessage = "CPU phải từ 1 đến 256 core.")] public int? CpuCores { get; init; }
    [Range(typeof(decimal), "0.01", "4096", ErrorMessage = "RAM phải lớn hơn 0 và không vượt 4096 GB.")] public decimal? RamGb { get; init; }
    [Range(1, int.MaxValue, ErrorMessage = "Dung lượng lưu trữ phải lớn hơn 0.")] public int? StorageGb { get; init; }
    [StringLength(30, ErrorMessage = "Loại lưu trữ tối đa 30 ký tự.")] public string? StorageType { get; init; }
    [Range(1, int.MaxValue, ErrorMessage = "Băng thông phải lớn hơn 0.")] public int? BandwidthGb { get; init; }
    public string? SpecificationsJson { get; init; }
    public bool IsFeatured { get; init; }
    [Range(0, int.MaxValue, ErrorMessage = "Thứ tự hiển thị không được âm.")] public int DisplayOrder { get; init; }
}

public sealed class PlanPriceRequest
{
    [Required(ErrorMessage = "Chu kỳ thanh toán là bắt buộc.")] public BillingCycle BillingCycle { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999", ErrorMessage = "Giá gốc phải là số không âm.")] public decimal OriginalPrice { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999", ErrorMessage = "Giá bán phải là số không âm.")] public decimal? SalePrice { get; init; }
    [RegularExpression("^[A-Za-z]{3}$", ErrorMessage = "Đơn vị tiền tệ phải là mã ISO gồm 3 chữ cái, ví dụ VND.")] public string Currency { get; init; } = "VND";
    public DateTime? EffectiveFrom { get; init; }
    public DateTime? EffectiveTo { get; init; }
    [StringLength(64, ErrorMessage = "Mã phiên bản dữ liệu không hợp lệ.")] public string? RowVersion { get; init; }
}

public sealed class PromotionRequest
{
    [Required, StringLength(50)] public string Code { get; init; } = string.Empty;
    [Required, StringLength(150)] public string Name { get; init; } = string.Empty;
    [StringLength(1000)] public string? Description { get; init; }
    [Required] public DiscountType DiscountType { get; init; }
    [Range(typeof(decimal), "0.01", "9999999999999999")] public decimal DiscountValue { get; init; }
    public DateTime StartAt { get; init; }
    public DateTime EndAt { get; init; }
    [Range(1, int.MaxValue)] public int? UsageLimit { get; init; }
    public IReadOnlyCollection<int> ServicePlanIds { get; init; } = Array.Empty<int>();
    [StringLength(64)] public string? RowVersion { get; init; }
}

public sealed record ServicePlanListQuery(
    int PageNumber = 1,
    int PageSize = 20,
    string? Search = null,
    string? CategorySlug = null,
    bool IncludeInactive = false);

public sealed record ServiceCategoryListQuery(int PageNumber = 1, int PageSize = 20, bool IncludeInactive = false);
