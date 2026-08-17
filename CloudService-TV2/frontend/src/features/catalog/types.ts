import type { BillingCycle } from "@/features/pricing/types";

export interface Page<T> { items: T[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number; }
export interface Category { id: number; name: string; slug: string; description: string | null; icon: string | null; displayOrder: number; isActive: boolean; }
export interface Price { id: number; billingCycle: BillingCycle; originalPrice: number; salePrice: number | null; effectivePrice: number; currency: string; effectiveFrom: string | null; effectiveTo: string | null; isActive: boolean; }
export interface Plan { id: number; categoryId: number; categoryName: string; categorySlug: string; name: string; slug: string; shortDescription: string | null; description: string | null; cpuCores: number | null; ramGb: number | null; storageGb: number | null; storageType: string | null; bandwidthGb: number | null; specificationsJson: string | null; qrTargetUrl: string | null; qrCodePath: string | null; qrGeneratedAt: string | null; isFeatured: boolean; displayOrder: number; isActive: boolean; prices: Price[]; }
export interface Promotion { id: number; code: string; name: string; description: string | null; discountType: string; discountValue: number; startAt: string; endAt: string; usageLimit: number | null; usedCount: number; isActive: boolean; servicePlanIds: number[]; }
