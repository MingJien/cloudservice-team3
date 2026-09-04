import { adminFetch, apiFetch } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";
export interface Affiliate { id: number; trackingCode: string; fullName: string; email: string; phone: string; websiteOrChannel: string | null; note: string | null; internalNote: string | null; status: "New" | "Processing" | "Done" | "Rejected"; affiliateCode: string | null; commissionRate: number | null; partnerIsActive: boolean | null; clickCount: number; conversionCount: number; pendingCommission: number; createdAt: string; updatedAt: string | null; rowVersion: string; }
export type AffiliateApplicationStatus = Affiliate["status"];
export interface AffiliateApplicationSubmission { trackingCode: string; status: AffiliateApplicationStatus; createdAt: string; }
export interface AffiliateApplicationTracking { trackingCode: string; status: AffiliateApplicationStatus; createdAt: string; updatedAt: string | null; affiliateCode: string | null; }
export interface ProvisionedAffiliateAccount { userName: string; temporaryPassword: string; mustChangePassword: boolean; emailDeliveryStatus: "Sent" | "Disabled" | "Failed"; }
export interface AffiliateStatusUpdateResult { item: Affiliate; provisionedAccount: ProvisionedAffiliateAccount | null; }
export function createAffiliate(body: unknown) { return apiFetch<AffiliateApplicationSubmission>("/affiliate-applications", { method: "POST", body: JSON.stringify(body) }); }
export function getAffiliateApplicationStatus(trackingCode: string) { return apiFetch<AffiliateApplicationTracking>(`/affiliate-applications/tracking/${encodeURIComponent(trackingCode)}`); }
export function getAffiliates(query = "pageNumber=1&pageSize=20") { return adminFetch<Page<Affiliate>>(`/affiliate-applications?${query}`); }
export function updateAffiliateStatus(id: number, body: unknown) { return adminFetch<AffiliateStatusUpdateResult>(`/affiliate-applications/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }); }
export function updateAffiliate(id: number, body: unknown) { return adminFetch<Affiliate>(`/affiliate-applications/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deleteAffiliate(id: number, rowVersion: string) {
  return adminFetch<void>(`/affiliate-applications/${id}`, {
    method: "DELETE",
    // DELETE request bodies are inconsistently forwarded by browsers and reverse
    // proxies. If-Match also expresses the intent correctly: archive only the
    // exact version the operator reviewed.
    headers: { "If-Match": `"${rowVersion}"` },
  });
}
export function trackAffiliateReferral(body: unknown) { return apiFetch<{ accepted: boolean; expiresAtUtc: string | null; proof?: string | null }>("/affiliate-referrals", { method: "POST", body: JSON.stringify(body) }); }
