using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudService.Application.Features.Orders.Events;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Notifications;

public sealed class TelegramNotificationSender(
    HttpClient httpClient,
    IOptions<TelegramOptions> options)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    private readonly TelegramOptions options = options.Value;

    public async Task SendAsync(string messageType, string payload, CancellationToken cancellationToken)
    {
        var text = messageType switch
        {
            "OrderCreatedV1" => FormatCreated(Deserialize<OrderCreatedV1>(payload)),
            "OrderStatusChangedV1" => FormatStatusChanged(Deserialize<OrderStatusChangedV1>(payload)),
            _ => throw new InvalidOperationException($"Unsupported outbox message type '{messageType}'.")
        };

        using var response = await httpClient.PostAsJsonAsync(
            $"/bot{options.BotToken}/sendMessage",
            new
            {
                chat_id = options.ChatId,
                text,
                parse_mode = "HTML",
                disable_web_page_preview = true
            },
            cancellationToken);

        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException($"Telegram returned HTTP {(int)response.StatusCode}: {body[..Math.Min(body.Length, 500)]}");
    }

    private static T Deserialize<T>(string payload) =>
        JsonSerializer.Deserialize<T>(payload, SerializerOptions)
        ?? throw new JsonException($"Cannot deserialize outbox payload as {typeof(T).Name}.");

    private static string FormatCreated(OrderCreatedV1 message)
    {
        var affiliate = string.IsNullOrWhiteSpace(message.AffiliateCode)
            ? string.Empty
            : $"\n🤝 Affiliate: <code>{Escape(message.AffiliateCode)}</code>";
        return $"🚀 <b>Có đơn hàng mới</b>\n📦 Mã: <code>{Escape(message.TrackingCode)}</code>\n🏷 Gói: {Escape(message.PlanName)}\n💰 Giá trị: {message.EstimatedAmount:N0} {Escape(message.Currency)}\n🔄 Trạng thái: {Escape(message.Status.ToString())}{affiliate}";
    }

    private static string FormatStatusChanged(OrderStatusChangedV1 message) =>
        $"🔄 <b>Đơn hàng đổi trạng thái</b>\n📦 Mã: <code>{Escape(message.TrackingCode)}</code>\nTrạng thái: {Escape(message.PreviousStatus.ToString())} → <b>{Escape(message.CurrentStatus.ToString())}</b>";

    private static string Escape(string value) => WebUtility.HtmlEncode(value);
}
