using System.Text.Json;
using System.Text.Json.Serialization;
using CloudService.Application.Common.Interfaces;
using CloudService.Domain.Entities;

namespace CloudService.Infrastructure.Persistence;

public sealed class OutboxWriter(ApplicationDbContext dbContext) : IOutboxWriter
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public void Enqueue<TPayload>(string type, TPayload payload, DateTime occurredOnUtc)
    {
        var json = JsonSerializer.Serialize(payload, SerializerOptions);
        dbContext.OutboxMessages.Add(new OutboxMessage(type, json, occurredOnUtc));
    }
}
