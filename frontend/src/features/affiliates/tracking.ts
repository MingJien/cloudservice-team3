export const AFFILIATE_CODE_COOKIE = "mn_affiliate_ref";
export const AFFILIATE_VISIT_COOKIE = "mn_affiliate_visit";
export const AFFILIATE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function normalizeAffiliateCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9_-]{3,50}$/.test(normalized) ? normalized : null;
}

export function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function writeAffiliateCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${AFFILIATE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
