import { adminFetch, apiFetch, ApiError, type ProblemDetails } from "@/lib/api-client";
import type { Page } from "@/features/catalog/types";
import type { BillingCycle } from "@/features/pricing/types";

export type OrderStatus = "New" | "Processing" | "Done" | "Rejected";
export interface OrderCreated {
  trackingCode: string; planName: string; billingCycle: BillingCycle; estimatedAmount: number;
  currency: string; status: OrderStatus; createdAt: string; affiliateCode: string | null;
}
export interface OrderTracking extends OrderCreated { updatedAt: string | null; }
export interface OrderItem {
  id: number; trackingCode: string; customerName: string; email: string; phone: string;
  companyName: string | null; servicePlanId: number; planName: string; billingCycle: BillingCycle;
  promotionCode: string | null; unitPrice: number; discountAmount: number; estimatedAmount: number;
  currency: string; note: string | null; internalNote: string | null; affiliateCode: string | null;
  affiliateCommissionAmount: number | null; status: OrderStatus; createdAt: string;
  updatedAt: string | null; rowVersion: string;
}
export interface OrderExportJob {
  jobId: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "Expired";
  requestedAtUtc: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  expiresAtUtc: string | null;
  downloadUrl: string | null;
  error: string | null;
}

export function createOrder(body: unknown, idempotencyKey: string) {
  return fetch("/api/orders", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  }).then(async (response) => {
    if (!response.ok) {
      const problem = await response.json().catch(() => ({})) as ProblemDetails;
      throw new ApiError(response.status, problem);
    }
    return await response.json() as OrderCreated;
  });
}

export function trackOrder(code: string) {
  return apiFetch<OrderTracking>("/order-requests/track/" + encodeURIComponent(code));
}

export function getOrders(query = "pageNumber=1&pageSize=20") {
  return adminFetch<Page<OrderItem>>("/order-requests?" + query);
}

export function updateOrderStatus(id: number, body: unknown) {
  return adminFetch<void>("/order-requests/" + id + "/status", { method: "PATCH", body: JSON.stringify(body) });
}

/**
 * Starts a durable server-side export and polls its state. The browser never
 * holds a long-running SQL/XLSX request open.
 */
export async function exportOrders(query = "") {
  const path = "/order-requests/export" + (query ? "?" + query : "");
  const job = await adminFetch<OrderExportJob>(path, { method: "POST" });
  let current = job;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (current.status === "Completed") break;
    if (current.status === "Failed" || current.status === "Expired") {
      throw new Error(current.error ?? "Tác vụ xuất dữ liệu không hoàn tất.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    current = await adminFetch<OrderExportJob>("/order-requests/export/" + current.jobId);
  }
  if (current.status !== "Completed") {
    throw new Error("Tác vụ xuất dữ liệu đang quá lâu. Hãy kiểm tra lại trong ít phút.");
  }
  const response = await fetch("/api/backend/order-requests/export/" + current.jobId + "/download", { cache: "no-store" });
  if (!response.ok) throw new Error("Không thể tải tệp xuất đã tạo.");
  return response.blob();
}
