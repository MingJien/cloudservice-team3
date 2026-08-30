namespace CloudService.Application.Common.Exceptions;

public sealed class IdempotencyReservationException : Exception
{
    public IdempotencyReservationException() : base("Idempotency key is already reserved.")
    {
    }
}
