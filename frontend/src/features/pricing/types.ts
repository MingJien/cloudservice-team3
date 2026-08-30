export type BillingCycle = "Monthly" | "Quarterly" | "Yearly";

export interface PricingQuoteRequest {
  servicePlanId: number;
  billingCycle: BillingCycle;
  promotionCode?: string;
}

export interface PricingQuoteResponse {
  servicePlanId: number;
  planName: string;
  planSlug: string;
  planPriceId: number;
  billingCycle: BillingCycle;
  originalPrice: number;
  effectivePlanPrice: number;
  planDiscountAmount: number;
  promotionDiscountAmount: number;
  totalDiscountAmount: number;
  totalPrice: number;
  currency: string;
  promotion: { code: string; name: string; discountType: string; discountValue: number } | null;
  calculatedAtUtc: string;
  /** Short-lived server signature required when an order is submitted. */
  quoteToken: string;
}

export interface ComparedPlanPrice {
  planPriceId: number;
  billingCycle: BillingCycle;
  originalPrice: number;
  salePrice: number | null;
  effectivePrice: number;
  currency: string;
}

export interface ComparedPlan {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  shortDescription: string | null;
  cpuCores: number | null;
  ramGb: number | null;
  storageGb: number | null;
  storageType: string | null;
  bandwidthGb: number | null;
  specifications: Record<string, string>;
  prices: ComparedPlanPrice[];
}

export interface PlanComparisonResponse {
  plans: ComparedPlan[];
  comparedAtUtc: string;
}
