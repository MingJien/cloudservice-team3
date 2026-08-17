using CloudService.Domain.Common;
using CloudService.Domain.Enums;

namespace CloudService.Domain.Entities;

public sealed class Promotion : AuditableEntity
{
    private Promotion()
    {
    }

    public Promotion(string code, string name, DiscountType discountType, decimal discountValue, DateTime startAt, DateTime endAt)
    {
        if (endAt <= startAt)
        {
            throw new ArgumentException("Promotion end must be after start.", nameof(endAt));
        }

        if (discountValue <= 0 || (discountType == DiscountType.Percentage && discountValue > 100))
        {
            throw new ArgumentOutOfRangeException(nameof(discountValue));
        }

        Code = Guard.Required(code, nameof(code));
        Name = Guard.Required(name, nameof(name));
        DiscountType = discountType;
        DiscountValue = discountValue;
        StartAt = startAt;
        EndAt = endAt;
    }

    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public DateTime StartAt { get; private set; }
    public DateTime EndAt { get; private set; }
    public int? UsageLimit { get; private set; }
    public int UsedCount { get; private set; }
    public bool IsActive { get; private set; } = true;
    public ICollection<PromotionServicePlan> PromotionServicePlans { get; private set; } = new List<PromotionServicePlan>();

    public void Update(
        string code,
        string name,
        DiscountType discountType,
        decimal discountValue,
        DateTime startAt,
        DateTime endAt,
        int? usageLimit,
        string? description)
    {
        if (endAt <= startAt) throw new ArgumentException("Promotion end must be after start.", nameof(endAt));
        if (discountValue <= 0 || (discountType == DiscountType.Percentage && discountValue > 100))
            throw new ArgumentOutOfRangeException(nameof(discountValue));
        if (usageLimit is <= 0 || (usageLimit is not null && usageLimit < UsedCount))
            throw new ArgumentOutOfRangeException(nameof(usageLimit));

        Code = Guard.Required(code, nameof(code)).ToUpperInvariant();
        Name = Guard.Required(name, nameof(name));
        DiscountType = discountType;
        DiscountValue = discountValue;
        StartAt = startAt;
        EndAt = endAt;
        UsageLimit = usageLimit;
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    public void SetActive(bool isActive) => IsActive = isActive;
}
