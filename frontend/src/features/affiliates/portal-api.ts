import { adminFetch } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";

export type AffiliateTier = "Newbie" | "Bronze" | "Silver" | "Gold";
export type CommissionStatus = "Pending" | "Eligible" | "Rejected" | "Paid";
export type PayoutStatus = "Requested" | "Processing" | "Paid" | "Rejected";
export interface AffiliateWeeklyPerformance { weekStartUtc: string; completedOrders: number; commissionAmount: number; }

export interface AffiliateDashboard {
  partnerCode: string; displayName: string; tier: AffiliateTier; commissionRate: number;
  clickCount: number; conversionCount: number; conversionRate: number;
  pendingBalance: number; availableBalance: number; paidBalance: number;
  tierEvaluatedAtUtc: string | null; ordersUntilNextTier: number; nextTier: string | null;
  weeklyPerformance: AffiliateWeeklyPerformance[];
}
export interface AffiliateOrder {
  id: number; trackingCode: string; maskedCustomerName: string; planName: string;
  revenue: number; commissionAmount: number; commissionRate: number;
  commissionStatus: CommissionStatus; availableAtUtc: string | null; createdAt: string;
}
export interface AffiliatePayout {
  id: number; requestCode: string; partnerCode: string; partnerName: string; amount: number;
  bankName: string; maskedBankAccount: string; bankAccountNumber: string | null; bankAccountName: string; status: PayoutStatus;
  requestedAtUtc: string; paidAtUtc: string | null; reviewNote: string | null; rowVersion: string;
}

export const getAffiliateDashboard = () => adminFetch<AffiliateDashboard>("/affiliate-portal/dashboard");
export const getAffiliateOrders = (page = 1) => adminFetch<Page<AffiliateOrder>>(`/affiliate-portal/orders?pageNumber=${page}&pageSize=10`);
export const getAffiliatePayouts = (page = 1) => adminFetch<Page<AffiliatePayout>>(`/affiliate-portal/payouts?pageNumber=${page}&pageSize=10`);
export const requestAffiliatePayout = (body: unknown) => adminFetch<AffiliatePayout>("/affiliate-portal/payouts", { method: "POST", body: JSON.stringify(body) });
export const getAdminAffiliatePayouts = (query: string) => adminFetch<Page<AffiliatePayout>>(`/affiliate-payouts?${query}`);
export const reviewAffiliatePayout = (id: number, body: unknown) => adminFetch<AffiliatePayout>(`/affiliate-payouts/${id}/status`, { method: "PATCH", body: JSON.stringify(body) });
