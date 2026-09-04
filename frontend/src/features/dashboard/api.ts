import { adminFetch } from "@/lib/api-client";
export interface Dashboard { summary: { totalOrders: number; newOrders: number; processingOrders: number; doneOrders: number; rejectedOrders: number; totalAffiliateApplications: number; newAffiliateApplications: number; newContacts: number }; ordersByMonth: { month: string; count: number }[]; topServicePlans: { servicePlanId: number; planName: string; count: number }[]; }
export function getDashboard(months = 6) { return adminFetch<Dashboard>(`/dashboard?months=${months}`); }
