using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudService.Application.Features.Orders.Events;
using CloudService.Application.Features.Services.Interfaces;
using CloudService.Domain.Enums;
using Microsoft.Extensions.Options;

namespace CloudService.Infrastructure.Notifications;

public sealed class TelegramNotificationSender(
    HttpClient httpClient,
    IQrCodeGenerator qrCodeGenerator,
    IOptions<TelegramOptions> options)
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
    private static readonly CultureInfo VietnameseCulture = CultureInfo.GetCultureInfo("vi-VN");
    private readonly TelegramOptions options = options.Value;

    public async Task SendAsync(string messageType, string payload, CancellationToken cancellationToken)
    {
        switch (messageType)
        {
            case "OrderCreatedV2":
                await SendOrderCardAsync(Deserialize<OrderCreatedV2>(payload), cancellationToken);
                break;
            case "OrderCreatedV1":
                await SendLegacyOrderAsync(Deserialize<OrderCreatedV1>(payload), cancellationToken);
                break;
            case "OrderStatusChangedV2":
                await SendStatusCardAsync(Deserialize<OrderStatusChangedV2>(payload), cancellationToken);
                break;
            case "OrderStatusChangedV1":
                await SendLegacyStatusChangedAsync(Deserialize<OrderStatusChangedV1>(payload), cancellationToken);
                break;
            default:
                throw new InvalidOperationException($"Unsupported outbox message type '{messageType}'.");
        }
    }

    private async Task SendOrderCardAsync(OrderCreatedV2 message, CancellationToken cancellationToken)
    {
        var trackingUrl = BuildTrackingUrl(message.TrackingCode);
        await SendPhotoAsync(
            FormatCreated(message),
            trackingUrl,
            BuildAdminUrl(message.TrackingCode),
            $"order-{SafeFileName(message.TrackingCode)}.png",
            cancellationToken);
    }

    private async Task SendStatusCardAsync(OrderStatusChangedV2 message, CancellationToken cancellationToken)
    {
        var trackingUrl = BuildTrackingUrl(message.TrackingCode);
        await SendPhotoAsync(
            FormatStatusChanged(message),
            trackingUrl,
            BuildAdminUrl(message.TrackingCode),
            $"order-status-{SafeFileName(message.TrackingCode)}.png",
            cancellationToken);
    }

    private async Task SendPhotoAsync(
        string caption,
        string trackingUrl,
        string adminUrl,
        string fileName,
        CancellationToken cancellationToken)
    {
        var qrBytes = qrCodeGenerator.CreatePng(trackingUrl);

        using var form = new MultipartFormDataContent();
        form.Add(new StringContent(options.ChatId), "chat_id");
        form.Add(new StringContent(caption, Encoding.UTF8), "caption");
        form.Add(new StringContent("HTML"), "parse_mode");
        form.Add(new StringContent(
            JsonSerializer.Serialize(CreateKeyboard(trackingUrl, adminUrl), SerializerOptions),
            Encoding.UTF8), "reply_markup");
        using var photo = new ByteArrayContent(qrBytes);
        photo.Headers.ContentType = new("image/png");
        form.Add(photo, "photo", fileName);

        using var response = await httpClient.PostAsync($"/bot{options.BotToken}/sendPhoto", form, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    private async Task SendLegacyOrderAsync(OrderCreatedV1 message, CancellationToken cancellationToken)
    {
        var trackingUrl = BuildTrackingUrl(message.TrackingCode);
        var text = $"🟢 <b>ĐƠN DỊCH VỤ MỚI</b>\n" +
                   $"<code>{Escape(message.TrackingCode)}</code>\n\n" +
                   $"📦 <b>Dịch vụ</b>\n• Gói: {Escape(message.PlanName)}\n\n" +
                   $"💳 <b>Giá trị dự kiến</b>\n<b>{FormatMoney(message.EstimatedAmount, message.Currency)}</b>\n\n" +
                   $"{StatusIcon(message.Status)} {StatusLabel(message.Status)}\n" +
                   $"<i>Sự kiện cũ V1 · {FormatTime(message.OccurredOnUtc)}</i>";
        await SendTextAsync(text, trackingUrl, BuildAdminUrl(message.TrackingCode), cancellationToken);
    }

    private async Task SendLegacyStatusChangedAsync(OrderStatusChangedV1 message, CancellationToken cancellationToken)
    {
        var trackingUrl = BuildTrackingUrl(message.TrackingCode);
        var text = $"🔄 <b>CẬP NHẬT TRẠNG THÁI ĐƠN</b>\n" +
                   $"<code>{Escape(message.TrackingCode)}</code>\n\n" +
                   $"{StatusIcon(message.PreviousStatus)} {StatusLabel(message.PreviousStatus)}\n" +
                   $"        ↓\n" +
                   $"{StatusIcon(message.CurrentStatus)} <b>{StatusLabel(message.CurrentStatus)}</b>\n\n" +
                   $"🕒 {FormatTime(message.OccurredOnUtc)}\n" +
                   $"<i>Trace: {message.EventId.ToString("N")[..8].ToUpperInvariant()}</i>";
        await SendTextAsync(text, trackingUrl, BuildAdminUrl(message.TrackingCode), cancellationToken);
    }

    private async Task SendTextAsync(string text, string trackingUrl, string adminUrl, CancellationToken cancellationToken)
    {
        using var response = await httpClient.PostAsJsonAsync(
            $"/bot{options.BotToken}/sendMessage",
            new
            {
                chat_id = options.ChatId,
                text,
                parse_mode = "HTML",
                disable_web_page_preview = true,
                reply_markup = CreateKeyboard(trackingUrl, adminUrl)
            },
            SerializerOptions,
            cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
    }

    internal string FormatCreated(OrderCreatedV2 message)
    {
        var email = options.MaskCustomerContact ? MaskEmail(message.Email) : message.Email;
        var phone = options.MaskCustomerContact ? MaskPhone(message.Phone) : message.Phone;
        var company = string.IsNullOrWhiteSpace(message.CompanyName)
            ? string.Empty
            : $"\n• Doanh nghiệp: {Escape(message.CompanyName)}";
        var promotion = string.IsNullOrWhiteSpace(message.PromotionCode)
            ? "Không áp dụng"
            : $"<code>{Escape(message.PromotionCode)}</code>";
        var affiliate = string.IsNullOrWhiteSpace(message.AffiliateCode)
            ? string.Empty
            : $"\n• Affiliate: <code>{Escape(message.AffiliateCode)}</code>";

        return $"📥 <b>YÊU CẦU DỊCH VỤ MỚI</b>\n" +
               $"<code>{Escape(message.TrackingCode)}</code> · #NEW_ORDER\n" +
               $"━━━━━━━━━━━━━━\n\n" +
               $"👤 <b>Khách hàng</b>\n" +
               $"• Tên: {Escape(message.CustomerName)}{company}\n" +
               $"• Liên hệ: {Escape(phone)} · {Escape(email)}\n\n" +
               $"🧩 <b>Cấu hình đặt mua</b>\n" +
               $"• Gói: <b>{Escape(message.PlanName)}</b>\n" +
               $"• Chu kỳ: {BillingCycleLabel(message.BillingCycle)}\n" +
               $"• Khuyến mãi: {promotion}{affiliate}\n\n" +
               $"💳 <b>Giá trị dự kiến</b>\n" +
               $"<b>{FormatMoney(message.EstimatedAmount, message.Currency)}</b>\n\n" +
               $"📌 <b>Việc cần làm</b>\n" +
               $"{StatusIcon(message.Status)} <b>{StatusLabel(message.Status)}</b> — mở Admin để tiếp nhận\n\n" +
               $"🕒 {FormatTime(message.OccurredOnUtc)}\n" +
               $"<i>Trace {Trace(message.EventId)} · QR mở trạng thái mới nhất</i>";
    }

    internal string FormatStatusChanged(OrderStatusChangedV2 message)
    {
        var note = string.IsNullOrWhiteSpace(message.InternalNote)
            ? "Không có ghi chú bổ sung"
            : Escape(Truncate(message.InternalNote.Trim(), 220));

        return $"{StatusIcon(message.CurrentStatus)} <b>{StatusHeadline(message.CurrentStatus)}</b>\n" +
               $"<code>{Escape(message.TrackingCode)}</code> · #ORDER_UPDATE\n" +
               $"━━━━━━━━━━━━━━\n\n" +
               $"🧩 <b>Đơn hàng</b>\n" +
               $"• Gói: <b>{Escape(message.PlanName)}</b>\n" +
               $"• Chu kỳ: {BillingCycleLabel(message.BillingCycle)}\n" +
               $"• Khách: {Escape(message.CustomerName)}\n" +
               $"• Giá trị: <b>{FormatMoney(message.EstimatedAmount, message.Currency)}</b>\n\n" +
               $"🔁 <b>Luồng trạng thái</b>\n" +
               $"{StatusIcon(message.PreviousStatus)} {StatusLabel(message.PreviousStatus)} → " +
               $"{StatusIcon(message.CurrentStatus)} <b>{StatusLabel(message.CurrentStatus)}</b>\n\n" +
               $"📝 <b>Ghi chú vận hành</b>\n{note}\n\n" +
               $"👨‍💻 Operator #{message.ActorUserId} · 🕒 {FormatTime(message.OccurredOnUtc)}\n" +
               $"<i>Trace {Trace(message.EventId)} · QR mở trạng thái mới nhất</i>";
    }

    private string BuildTrackingUrl(string trackingCode) =>
        $"{options.PublicBaseUrl.TrimEnd('/')}/orders/track/{Uri.EscapeDataString(trackingCode)}";

    private string BuildAdminUrl(string trackingCode) =>
        $"{options.PublicBaseUrl.TrimEnd('/')}/admin/order-requests?search={Uri.EscapeDataString(trackingCode)}";

    private static object CreateKeyboard(string trackingUrl, string adminUrl) => new
    {
        inline_keyboard = new[]
        {
            new[]
            {
                new { text = "🔎 Khách xem đơn", url = trackingUrl },
                new { text = "🧭 Xử lý trong Admin", url = adminUrl }
            }
        }
    };

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode) return;
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new HttpRequestException($"Telegram returned HTTP {(int)response.StatusCode}: {body[..Math.Min(body.Length, 500)]}");
    }

    private static T Deserialize<T>(string payload) =>
        JsonSerializer.Deserialize<T>(payload, SerializerOptions)
        ?? throw new JsonException($"Cannot deserialize outbox payload as {typeof(T).Name}.");

    private static string BillingCycleLabel(BillingCycle cycle) => cycle switch
    {
        BillingCycle.Monthly => "Hàng tháng",
        BillingCycle.Quarterly => "Hàng quý",
        BillingCycle.Yearly => "Hàng năm",
        _ => cycle.ToString()
    };

    private static string StatusLabel(OrderRequestStatus status) => status switch
    {
        OrderRequestStatus.New => "Chờ tiếp nhận",
        OrderRequestStatus.Processing => "Đang xử lý",
        OrderRequestStatus.Done => "Đã hoàn tất",
        OrderRequestStatus.Rejected => "Đã từ chối",
        _ => status.ToString()
    };

    private static string StatusIcon(OrderRequestStatus status) => status switch
    {
        OrderRequestStatus.New => "🟡",
        OrderRequestStatus.Processing => "🔵",
        OrderRequestStatus.Done => "✅",
        OrderRequestStatus.Rejected => "🔴",
        _ => "⚪"
    };

    private static string StatusHeadline(OrderRequestStatus status) => status switch
    {
        OrderRequestStatus.New => "ĐƠN ĐANG CHỜ TIẾP NHẬN",
        OrderRequestStatus.Processing => "ĐƠN ĐÃ ĐƯỢC TIẾP NHẬN",
        OrderRequestStatus.Done => "ĐƠN ĐÃ HOÀN TẤT",
        OrderRequestStatus.Rejected => "ĐƠN ĐÃ BỊ TỪ CHỐI",
        _ => "TRẠNG THÁI ĐƠN ĐÃ THAY ĐỔI"
    };

    private static string FormatMoney(decimal amount, string currency)
    {
        var suffix = currency.Equals("VND", StringComparison.OrdinalIgnoreCase) ? "₫" : Escape(currency);
        return $"{amount.ToString("N0", VietnameseCulture)} {suffix}";
    }

    private static string FormatTime(DateTime utc) =>
        $"{DateTime.SpecifyKind(utc, DateTimeKind.Utc).AddHours(7):dd/MM/yyyy HH:mm} (GMT+7)";

    private static string MaskPhone(string value)
    {
        var trimmed = value.Trim();
        return trimmed.Length <= 4 ? "••••" : $"{trimmed[..2]}•••••{trimmed[^3..]}";
    }

    private static string MaskEmail(string value)
    {
        var parts = value.Trim().Split('@', 2);
        if (parts.Length != 2) return "•••";
        var visible = parts[0].Length > 0 ? parts[0][..1] : string.Empty;
        return $"{visible}•••@{parts[1]}";
    }

    private static string SafeFileName(string value) =>
        new(value.Where(character => char.IsLetterOrDigit(character) || character is '-' or '_').ToArray());

    private static string Trace(Guid eventId) => eventId.ToString("N")[..8].ToUpperInvariant();

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : $"{value[..(maxLength - 1)]}…";

    private static string Escape(string value) => WebUtility.HtmlEncode(value);
}
