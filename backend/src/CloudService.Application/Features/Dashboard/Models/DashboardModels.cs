namespace CloudService.Application.Features.Dashboard.Models;

public sealed record DashboardSummary(int TotalOrders, int NewOrders, int ProcessingOrders, int DoneOrders, int RejectedOrders, int TotalAffiliateApplications, int NewAffiliateApplications, int NewContacts);
public sealed record OrdersByMonthItem(string Month, int Count);
public sealed record TopServicePlanItem(int ServicePlanId, string PlanName, int Count);
public sealed record DashboardResponse(DashboardSummary Summary, IReadOnlyCollection<OrdersByMonthItem> OrdersByMonth, IReadOnlyCollection<TopServicePlanItem> TopServicePlans);
