using System.ComponentModel.DataAnnotations;

namespace CloudService.Infrastructure.Notifications;

public sealed class TelegramOptions
{
    public const string SectionName = "Telegram";

    public bool Enabled { get; init; }
    public string BotToken { get; init; } = string.Empty;
    public string ChatId { get; init; } = string.Empty;
    [Range(1, 60)] public int PollIntervalSeconds { get; init; } = 5;
    [Range(1, 100)] public int BatchSize { get; init; } = 20;
    [Range(1, 30)] public int MaxAttempts { get; init; } = 8;
    [Range(15, 600)] public int LeaseSeconds { get; init; } = 60;
}
