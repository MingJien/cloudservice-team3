import { adminFetch, apiFetch } from "@/lib/api-client";
import type { Category, Page, Plan, Price, Promotion } from "./types";

export function getCategories() { return apiFetch<Page<Category>>("/service-categories?pageNumber=1&pageSize=50"); }
export function getPlans(query = "pageNumber=1&pageSize=50") { return apiFetch<Page<Plan>>(`/service-plans?${query}`); }
export function getPlan(slug: string) { return apiFetch<Plan>(`/service-plans/${encodeURIComponent(slug)}`); }
export function getAdminPlans(query = "pageNumber=1&pageSize=100") { return adminFetch<Page<Plan>>(`/admin/service-plans?${query}`); }
export function getAdminCategories(query = "pageNumber=1&pageSize=100") { return adminFetch<Page<Category>>(`/service-categories?${query}&includeInactive=true`); }
export function createCategory(body: unknown) { return adminFetch<Category>("/service-categories", { method: "POST", body: JSON.stringify(body) }); }
export function updateCategory(id: number, body: unknown) { return adminFetch<Category>(`/service-categories/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deactivateCategory(id: number) { return adminFetch<void>(`/service-categories/${id}`, { method: "DELETE" }); }
export function createPlan(body: unknown) { return adminFetch<Plan>("/service-plans", { method: "POST", body: JSON.stringify(body) }); }
export function updatePlan(id: number, body: unknown) { return adminFetch<Plan>(`/service-plans/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deactivatePlan(id: number) { return adminFetch<void>(`/service-plans/${id}`, { method: "DELETE" }); }
export function createPrice(planId: number, body: unknown) { return adminFetch<Price>(`/plan-prices?servicePlanId=${planId}`, { method: "POST", body: JSON.stringify(body) }); }
export function updatePrice(id: number, body: unknown) { return adminFetch<Price>(`/plan-prices/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deactivatePrice(id: number) { return adminFetch<void>(`/plan-prices/${id}`, { method: "DELETE" }); }
export function getPromotions() { return adminFetch<Promotion[]>("/admin/promotions"); }
export function createPromotion(body: unknown) { return adminFetch<Promotion>("/promotions", { method: "POST", body: JSON.stringify(body) }); }
export function updatePromotion(id: number, body: unknown) { return adminFetch<Promotion>(`/promotions/${id}`, { method: "PUT", body: JSON.stringify(body) }); }
export function deactivatePromotion(id: number) { return adminFetch<void>(`/promotions/${id}`, { method: "DELETE" }); }
export function generatePlanQr(id: number) { return adminFetch<{ servicePlanId: number; targetUrl: string; dataUrl: string }>(`/service-plans/${id}/qr-code`, { method: "POST" }); }
