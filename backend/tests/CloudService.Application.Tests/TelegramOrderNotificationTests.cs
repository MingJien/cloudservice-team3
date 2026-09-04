using System.Net;
using System.Text;
using System.Text.Json;
using CloudService.Application.Features.Orders.Events;
using CloudService.Domain.Enums;
using CloudService.Infrastructure.Notifications;
using CloudService.Infrastructure.QRCode;
using Microsoft.Extensions.Options;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class TelegramOrderNotificationTests
{
    [Fact]
    public async Task New_order_sends_png_qr_readable_caption_and_safe_links()
    {
        var handler = new CapturingHandler();
        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://api.telegram.org/") };
        var sender = new TelegramNotificationSender(
            client,
            new SvgQrCodeGenerator(),
            Options.Create(new TelegramOptions
            {
                BotToken = "test-token",
                ChatId = "-100123",
                PublicBaseUrl = "https://cloud.example.vn",
                MaskCustomerContact = true
            }));
        var message = new OrderCreatedV2(
            Guid.Parse("d083c99d-85a6-4bb8-b29a-b2c13c96717b"),
            "ORD-260823-ABC123",
            "VPS Mekong Pro",
            BillingCycle.Yearly,
            5_490_000m,
            "VND",
            OrderRequestStatus.New,
            "Nguyễn Minh An",
            "an.nguyen@example.vn",
            "0912345678",
            "Công ty Mekong",
            "YEARLY20",
            "PARTNER20",
            new DateTime(2026, 8, 23, 4, 30, 0, DateTimeKind.Utc));

        await sender.SendAsync("OrderCreatedV2", JsonSerializer.Serialize(message), CancellationToken.None);

        Assert.EndsWith("/bottest-token/sendPhoto", handler.RequestUri?.AbsolutePath);
        Assert.Equal("multipart/form-data", handler.ContentType);
        Assert.Contains("ORD-260823-ABC123", handler.Body);
        Assert.Contains("VPS Mekong Pro", handler.Body);
        Assert.Contains("Hàng năm", handler.Body);
        Assert.Contains("09•••••678", handler.Body);
        Assert.Contains("a•••@example.vn", handler.Body);
        Assert.Contains("https://cloud.example.vn/orders/track/ORD-260823-ABC123", handler.Body);
        Assert.Contains("https://cloud.example.vn/admin/order-requests?search=ORD-260823-ABC123", handler.Body);
        Assert.Contains("image/png", handler.Body);
    }

    [Fact]
    public async Task Status_change_sends_qr_photo_with_operational_context_and_order_links()
    {
        var handler = new CapturingHandler();
        using var client = new HttpClient(handler) { BaseAddress = new Uri("https://api.telegram.org/") };
        var sender = new TelegramNotificationSender(
            client,
            new SvgQrCodeGenerator(),
            Options.Create(new TelegramOptions
            {
                BotToken = "test-token",
                ChatId = "-100123",
                PublicBaseUrl = "https://cloud.example.vn"
            }));
        var message = new OrderStatusChangedV2(
            Guid.Parse("d083c99d-85a6-4bb8-b29a-b2c13c96717b"),
            "ORD-260823-ABC123",
            "VPS Mekong Pro",
            BillingCycle.Yearly,
            5_490_000m,
            "VND",
            "Nguyễn Minh An",
            OrderRequestStatus.New,
            OrderRequestStatus.Processing,
            "Đã xác nhận cấu hình, chờ phân bổ IP.",
            42,
            new DateTime(2026, 8, 23, 4, 30, 0, DateTimeKind.Utc));
        await sender.SendAsync("OrderStatusChangedV2", JsonSerializer.Serialize(message), CancellationToken.None);
        var readableBody = WebUtility.HtmlDecode(handler.Body);

        Assert.EndsWith("/bottest-token/sendPhoto", handler.RequestUri?.AbsolutePath);
        Assert.Equal("multipart/form-data", handler.ContentType);
        Assert.Contains("ĐƠN ĐÃ ĐƯỢC TIẾP NHẬN", handler.Body);
        Assert.Contains("VPS Mekong Pro", handler.Body);
        Assert.Contains("5.490.000", handler.Body);
        Assert.Contains("Đã xác nhận cấu hình", readableBody);
        Assert.Contains("Operator #42", handler.Body);
        Assert.Contains("https://cloud.example.vn/orders/track/ORD-260823-ABC123", handler.Body);
        Assert.Contains("https://cloud.example.vn/admin/order-requests?search=ORD-260823-ABC123", handler.Body);
        Assert.Contains("image/png", handler.Body);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }
        public string? ContentType { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            ContentType = request.Content?.Headers.ContentType?.MediaType;
            var bytes = request.Content is null
                ? []
                : await request.Content.ReadAsByteArrayAsync(cancellationToken);
            Body = Encoding.UTF8.GetString(bytes);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"ok\":true}", Encoding.UTF8, "application/json")
            };
        }
    }
}
