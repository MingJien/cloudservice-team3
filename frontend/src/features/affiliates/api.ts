import { adminFetch, apiFetch } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";
export interface Affiliate { id: number; fullName: string; email: string; phone: string; websiteOrChannel: string | null; note: string | null; internalNote: string | null; status: "New" | "Processing" | "Done" | "Rejected"; affiliateCode: string | null; commissionRate: number | null; partnerIsActive: boolean | null; clickCount: number; conversionCount: number; pendingCommission: number; createdAt: string; updatedAt: string | null; }
export function createAffiliate(body: unknown) { return apiFetch<Affiliate>("/affiliate-applications", { method: "POST", body: JSON.stringify(body) }); }
export function getAffiliates(query = "pageNumber=1&pageSize=20") { return adminFetch<Page<Affiliate>>(`/affiliate-applications?${query}`); }
export function updateAffiliateStatus(id: number, body: unknown) { return adminFetch<Affiliate>(`/affiliate-applications/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }); }
export function trackAffiliateReferral(body: unknown) { return apiFetch<{ accepted: boolean; expiresAtUtc: string | null }>("/affiliate-referrals", { method: "POST", body: JSON.stringify(body) }); }
