using CloudService.Application.Features.Pricing.Models;
using CloudService.Domain.Entities;
using CloudService.Domain.Enums;
using CloudService.Infrastructure.Authentication;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class QuoteAndExportSecurityTests
{
    private static readonly DateTime UtcNow = new(2026, 8, 28, 8, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Quote_proof_rejects_tampering_and_different_catalog_inputs()
    {
        var service = new HmacQuoteTokenService(Options.Create(new JwtOptions
        {
            Secret = "a-production-length-secret-for-tests-2026",
            Issuer = "test",
            Audience = "test"
        }));
        var quote = new PricingQuoteResponse(
            1, "Cloud Basic", "cloud-basic", 11, BillingCycle.Monthly,
            100m, 80m, 20m, 0m, 20m, 80m, "VND", null, UtcNow);
        var token = service.Create(quote);

        service.IsValid(token, new PricingQuoteRequest(1, BillingCycle.Monthly, null), quote, UtcNow).Should().BeTrue();
        service.IsValid(token + "x", new PricingQuoteRequest(1, BillingCycle.Monthly, null), quote, UtcNow).Should().BeFalse();
        service.IsValid(token, new PricingQuoteRequest(1, BillingCycle.Yearly, null), quote, UtcNow).Should().BeFalse();
    }

    [Fact]
    public void Export_job_does_not_expose_download_until_worker_completes()
    {
        var job = new OrderExportJob(7, OrderRequestStatus.New, "customer", UtcNow);

        job.IsDownloadable(UtcNow).Should().BeFalse();
        job.MarkProcessing(UtcNow.AddSeconds(1));
        job.Complete([1, 2, 3], "orders.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", UtcNow.AddSeconds(2), TimeSpan.FromHours(1));

        job.IsDownloadable(UtcNow.AddMinutes(1)).Should().BeTrue();
        job.Expire();
        job.IsDownloadable(UtcNow.AddMinutes(2)).Should().BeFalse();
    }
}
