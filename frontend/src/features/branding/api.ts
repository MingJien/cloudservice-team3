import { adminFetch, apiFetch } from "@/lib/api-client";

export interface Branding {
  brandName: string;
  logoUrl: string | null;
  updatedAt: string | null;
}

export function getBranding() {
  return apiFetch<Branding>("/branding", { cache: "no-store" });
}

export function uploadBrandLogo(file: File) {
  const body = new FormData();
  body.append("file", file);
  return adminFetch<Branding>("/branding/logo", { method: "POST", body });
}

export function resetBrandLogo() {
  return adminFetch<Branding>("/branding/logo", { method: "DELETE" });
}
