namespace CloudService.Application.Common.Interfaces;

public interface IOutboxWriter
{
    void Enqueue<TPayload>(string type, TPayload payload, DateTime occurredOnUtc);
}
