using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using Xunit;

namespace CloudService.Domain.Tests;

public sealed class ExtendedDomainBehaviorTests
{
    [Fact]
    public void Service_plan_update_rejects_non_positive_resource_values()
    {
        var plan = new ServicePlan(1, "Basic", "basic");

        Assert.Throws<ArgumentOutOfRangeException>(() => plan.Update(1, "Basic", "basic", null, null, 0, 2, 40, "NVMe", 1000, null, true, 1));
    }

    [Fact]
    public void Plan_price_update_normalizes_currency_and_keeps_sale_price_valid()
    {
        var price = new PlanPrice(1, BillingCycle.Monthly, 100m, 80m);

        price.Update(BillingCycle.Monthly, 100m, 75m, " usd ", null, null);

        Assert.Equal("USD", price.Currency);
        Assert.Equal(75m, price.SalePrice);
        Assert.Throws<ArgumentOutOfRangeException>(() => price.Update(BillingCycle.Monthly, 100m, 101m, "USD", null, null));
    }

    [Fact]
    public void News_article_publish_unpublish_and_view_count_are_explicit_domain_behaviors()
    {
        var article = new NewsArticle(1, "Title", "title", "Content");
        var publishedAt = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        article.Publish(publishedAt);
        article.IncrementViewCount();
        article.Unpublish();

        Assert.False(article.IsPublished);
        Assert.Null(article.PublishedAt);
        Assert.Equal(1, article.ViewCount);
    }

    [Fact]
    public void Order_request_normalizes_promotion_and_customer_details()
    {
        var order = new OrderRequest("TRACK-002", "Customer", "customer@example.com", "0900000000", 1, 1, "Basic", BillingCycle.Monthly, 100m, 0m);

        order.SetPromotion(" save10 ", 10m);
        order.SetCustomerDetails(" Example Co ", " Need a callback ");

        Assert.Equal("SAVE10", order.PromotionCode);
        Assert.Equal(90m, order.EstimatedAmount);
        Assert.Equal("Example Co", order.CompanyName);
        Assert.Equal("Need a callback", order.Note);
    }

    [Fact]
    public void Testimonial_rejects_rating_outside_one_to_five()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Testimonial("Demo", "Content", 0));
        Assert.Throws<ArgumentOutOfRangeException>(() => new Testimonial("Demo", "Content", 6));
    }

    [Fact]
    public void Affiliate_application_preserves_status_and_trims_details()
    {
        var application = new AffiliateApplication("Partner", "partner@example.com", "0900000000");

        application.SetDetails(" partner.example.com ", " Interested ");
        application.ChangeStatus(AffiliateApplicationStatus.Processing, " Review ");

        Assert.Equal("partner.example.com", application.WebsiteOrChannel);
        Assert.Equal("Interested", application.Note);
        Assert.Equal(AffiliateApplicationStatus.Processing, application.Status);
        Assert.Equal("Review", application.InternalNote);
    }

    [Fact]
    public void Contact_request_rejects_unknown_status_value()
    {
        var contact = new ContactRequest("Customer", "customer@example.com", "Subject", "Message");

        Assert.Throws<ArgumentOutOfRangeException>(() => contact.ChangeStatus((ContactRequestStatus)999));
    }

    [Fact]
    public void Contact_request_follows_new_read_replied_workflow()
    {
        var contact = new ContactRequest("Customer", "customer@example.com", "Subject", "Message");

        contact.ChangeStatus(ContactRequestStatus.Read);
        contact.ChangeStatus(ContactRequestStatus.Replied);

        Assert.Equal(ContactRequestStatus.Replied, contact.Status);
    }

    [Fact]
    public void Contact_request_cannot_skip_or_reopen_terminal_workflow()
    {
        var contact = new ContactRequest("Customer", "customer@example.com", "Subject", "Message");

        Assert.Throws<InvalidOperationException>(() => contact.ChangeStatus(ContactRequestStatus.Replied));
        contact.ChangeStatus(ContactRequestStatus.Read);
        contact.ChangeStatus(ContactRequestStatus.Replied);
        Assert.Throws<InvalidOperationException>(() => contact.ChangeStatus(ContactRequestStatus.Read));
    }

    [Fact]
    public void Contact_reply_records_public_answer_and_completes_workflow()
    {
        var contact = new ContactRequest("Customer", "customer@example.com", "Subject", "Message");

        contact.Reply("  Đội ngũ sẽ liên hệ lúc 09:00 ngày mai.  ");

        Assert.Matches("^[a-f0-9]{32}$", contact.TrackingCode);
        Assert.Equal("Đội ngũ sẽ liên hệ lúc 09:00 ngày mai.", contact.AdminReply);
        Assert.Equal(ContactRequestStatus.Replied, contact.Status);
        Assert.NotNull(contact.RepliedAt);
    }

    [Fact]
    public void Service_category_can_be_disabled_without_erasing_its_identity()
    {
        var category = new ServiceCategory("VPS", "vps", 1);

        category.SetActive(false);

        Assert.Equal("vps", category.Slug);
        Assert.False(category.IsActive);
    }

    [Fact]
    public void Site_branding_can_reset_to_the_default_logo_without_deleting_brand_identity()
    {
        var branding = new SiteBranding("MekongNode");
        var now = new DateTime(2026, 8, 21, 0, 0, 0, DateTimeKind.Utc);

        branding.UpdateLogo(" /branding/logo.webp ", now);
        branding.UpdateLogo(null, now.AddMinutes(1));

        Assert.Equal("MekongNode", branding.BrandName);
        Assert.Null(branding.LogoUrl);
        Assert.Equal(now.AddMinutes(1), branding.UpdatedAt);
    }

    [Fact]
    public void Affiliate_partner_normalizes_code_and_rejects_invalid_commission_rate()
    {
        var partner = new AffiliatePartner(1, " kol_123 ", "KOL Demo", 10.125m);

        Assert.Equal("KOL_123", partner.Code);
        Assert.Equal(10.13m, partner.CommissionRate);
        Assert.Throws<ArgumentException>(() => AffiliatePartner.NormalizeCode("bad code"));
        Assert.Throws<ArgumentOutOfRangeException>(() => new AffiliatePartner(1, "VALID", "KOL Demo", 100.01m));
    }

    [Fact]
    public void Affiliate_attribution_snapshots_revenue_and_moves_commission_through_workflow()
    {
        var partner = new AffiliatePartner(1, "KOL123", "KOL Demo", 10m);
        var order = new OrderRequest(
            "ORD-AFF001",
            "Customer",
            "customer@example.com",
            "0900000000",
            1,
            1,
            "Business",
            BillingCycle.Monthly,
            1_000_000m,
            100_000m);
        var attribution = new AffiliateAttribution(partner, order, partner.Code, partner.CommissionRate);
        var now = new DateTime(2026, 8, 22, 0, 0, 0, DateTimeKind.Utc);

        Assert.Equal(900_000m, attribution.RevenueSnapshot);
        Assert.Equal(90_000m, attribution.CommissionAmount);
        Assert.Equal(AffiliateCommissionStatus.Pending, attribution.Status);

        attribution.MarkEligible(now);

        Assert.Equal(AffiliateCommissionStatus.Eligible, attribution.Status);
        Assert.Equal(now, attribution.EligibleAtUtc);
    }

    [Fact]
    public void Affiliate_referral_is_single_use_and_cannot_convert_twice()
    {
        var now = DateTime.UtcNow;
        var referral = new AffiliateReferral(1, Guid.NewGuid(), now.AddDays(30), "/pricing", null);
        var order = new OrderRequest("ORD-AFF002", "Customer", "customer@example.com", "0900000000", 1, 1, "Basic", BillingCycle.Monthly, 100m, 0m);

        referral.MarkConverted(order, now);

        Assert.False(referral.IsValidAt(now.AddSeconds(1)));
        Assert.Equal(now, referral.ConvertedAtUtc);
        Assert.Throws<InvalidOperationException>(() => referral.MarkConverted(order, now.AddSeconds(1)));
    }

    [Fact]
    public void Outbox_message_retries_then_dead_letters_without_losing_payload()
    {
        var now = new DateTime(2026, 8, 22, 0, 0, 0, DateTimeKind.Utc);
        var message = new OutboxMessage("order.created.v1", "{\"trackingCode\":\"ORD-001\"}", now);

        Assert.True(message.CanBeClaimed(now));
        message.Claim(Guid.NewGuid(), now.AddMinutes(1));
        Assert.False(message.CanBeClaimed(now));

        message.MarkFailed("Telegram timeout", now.AddMinutes(2), maxAttempts: 2);
        Assert.Equal(OutboxMessageStatus.Pending, message.Status);
        Assert.Equal(1, message.AttemptCount);

        message.MarkFailed("Telegram timeout", now.AddMinutes(5), maxAttempts: 2);
        Assert.Equal(OutboxMessageStatus.DeadLetter, message.Status);
        Assert.Equal(2, message.AttemptCount);
        Assert.Contains("ORD-001", message.Payload);
    }
}
