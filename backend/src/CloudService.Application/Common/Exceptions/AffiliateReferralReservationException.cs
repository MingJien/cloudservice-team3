namespace CloudService.Application.Common.Exceptions;

/// <summary>
/// Raised when two browser tabs/requests try to claim the same referral visit.
/// The unique VisitId index is the authoritative arbiter; the application then
/// re-reads the winner instead of leaking a database 500 to an otherwise valid visit.
/// </summary>
public sealed class AffiliateReferralReservationException : Exception
{
    public AffiliateReferralReservationException() : base("Referral visit is already reserved.")
    {
    }
}
