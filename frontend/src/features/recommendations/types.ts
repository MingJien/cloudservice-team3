import type { BillingCycle } from "@/features/pricing/types";

export type ServicePurpose = "Website" | "Ecommerce" | "BusinessApplication" | "Development" | "Email" | "General";
export type TrafficLevel = "Low" | "Medium" | "High";

export interface RecommendationRequest {
  budget: number;
  billingCycle: BillingCycle;
  purpose: ServicePurpose;
  traffic: TrafficLevel;
  minimumCpuCores: number;
  minimumRamGb: number;
  minimumStorageGb: number;
  maxResults: number;
}

export interface RecommendedPlan {
  servicePlanId: number;
  planName: string;
  planSlug: string;
  categoryName: string;
  score: number;
  billingCycle: BillingCycle;
  price: number;
  currency: string;
  reasons: string[];
}

export interface RecommendationResponse {
  items: RecommendedPlan[];
  evaluatedAtUtc: string;
}
