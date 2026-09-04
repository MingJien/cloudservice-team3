import type { Price } from "@/features/catalog/types";

export function FormError({ message }: { message: string }) {
  return message ? <p className="mb-5 rounded-xl border border-danger-600/30 bg-danger-600/5 p-4 text-sm text-danger-600" role="alert">{message}</p> : null;
}

export function toNumberOrNull(value: string) { return value.trim() === "" ? null : Number(value); }

export function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const dateStr = value.endsWith("Z") ? value : value + "Z";
  const date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function nowLocalDateTime() { return toLocalDateTime(new Date().toISOString()); }
export function toUtc(value: string) { return value ? new Date(value).toISOString() : null; }
export function formatAmount(value: number) { return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value); }
export function formatDate(value: string | null) { 
  if (!value) return "Không giới hạn";
  const dateStr = value.endsWith("Z") ? value : value + "Z";
  return new Date(dateStr).toLocaleString("vi-VN"); 
}

export function priceWindow(price: Price): { label: string; variant: "success" | "warning" | "danger" | "neutral" } {
  if (!price.isActive) return { label: "Đã tắt", variant: "neutral" };
  const now = Date.now();
  const effectiveFrom = price.effectiveFrom ? new Date(price.effectiveFrom.endsWith("Z") ? price.effectiveFrom : price.effectiveFrom + "Z").getTime() : null;
  const effectiveTo = price.effectiveTo ? new Date(price.effectiveTo.endsWith("Z") ? price.effectiveTo : price.effectiveTo + "Z").getTime() : null;
  if (effectiveFrom && effectiveFrom > now) return { label: "Sắp hiệu lực", variant: "warning" };
  if (effectiveTo && effectiveTo <= now) return { label: "Hết hiệu lực", variant: "danger" };
  return { label: "Đang hiệu lực", variant: "success" };
}
