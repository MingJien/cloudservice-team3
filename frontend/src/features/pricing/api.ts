import { apiFetch } from "@/lib/api-client";
import type { PlanComparisonResponse, PricingQuoteRequest, PricingQuoteResponse } from "./types";

export function requestPricingQuote(request: PricingQuoteRequest) {
  return apiFetch<PricingQuoteResponse>("/pricing/quotes", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function compareServicePlans(ids: number[]) {
  return apiFetch<PlanComparisonResponse>(`/service-plans/compare?ids=${encodeURIComponent(ids.join(","))}`);
}
