import { adminFetch, apiFetch } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";
import type { BillingCycle } from "@/features/pricing/types";

export type OrderStatus = "New" | "Processing" | "Done" | "Rejected";
export interface OrderCreated { trackingCode: string; planName: string; billingCycle: BillingCycle; estimatedAmount: number; currency: string; status: OrderStatus; createdAt: string; affiliateCode: string | null; }
export interface OrderTracking extends OrderCreated { updatedAt: string | null; }
export interface OrderItem { id: number; trackingCode: string; customerName: string; email: string; phone: string; companyName: string | null; servicePlanId: number; planName: string; billingCycle: BillingCycle; promotionCode: string | null; unitPrice: number; discountAmount: number; estimatedAmount: number; currency: string; note: string | null; internalNote: string | null; affiliateCode: string | null; affiliateCommissionAmount: number | null; status: OrderStatus; createdAt: string; updatedAt: string | null; rowVersion: string; }
export function createOrder(body: unknown, idempotencyKey: string) { return apiFetch<OrderCreated>("/order-requests", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: JSON.stringify(body) }); }
export function trackOrder(code: string) { return apiFetch<OrderTracking>(`/order-requests/track/${encodeURIComponent(code)}`); }
export function getOrders(query = "pageNumber=1&pageSize=20") { return adminFetch<Page<OrderItem>>(`/order-requests?${query}`); }
export function updateOrderStatus(id: number, body: unknown) { return adminFetch<void>(`/order-requests/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }); }
export async function exportOrders(query = "") { const suffix = query ? `?${query}` : ""; const response = await fetch(`/api/backend/order-requests/export${suffix}`, { cache: "no-store" }); if (!response.ok) throw new Error("Không thể xuất danh sách yêu cầu."); return response.blob(); }
