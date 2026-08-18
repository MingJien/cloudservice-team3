using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Xunit;

namespace CloudService.Domain.Tests;

public sealed class DomainInvariantTests
{
    [Fact]
    public void Order_request_calculates_estimated_amount_from_snapshot_values()
    {
        var order = new OrderRequest("TRACK-001", "Khách hàng", "customer@example.com", "0900000000", 1, 1, "Cloud VPS Basic", BillingCycle.Monthly, 590000m, 100000m);

        Assert.Equal(490000m, order.EstimatedAmount);
        Assert.Equal(OrderRequestStatus.New, order.Status);
    }

    [Fact]
    public void Order_request_rejects_discount_greater_than_unit_price()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new OrderRequest("TRACK-001", "Khách hàng", "customer@example.com", "0900000000", 1, 1, "Cloud VPS Basic", BillingCycle.Monthly, 100m, 101m));
    }

    [Fact]
    public void Percentage_promotion_rejects_value_above_one_hundred()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new Promotion("SALE", "Khuyến mãi", DiscountType.Percentage, 101m, DateTime.UtcNow, DateTime.UtcNow.AddDays(1)));
    }

    [Fact]
    public void Refresh_token_can_only_be_active_before_expiry_and_before_revocation()
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var token = new RefreshToken(1, new string('A', 128), "jwt-id", now.AddDays(1), now, "127.0.0.1");

        Assert.True(token.IsActive(now));
        token.Revoke(now.AddMinutes(1));
        Assert.False(token.IsActive(now.AddMinutes(2)));
    }
}
