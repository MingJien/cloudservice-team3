export const AFFILIATE_CODE_COOKIE = "mn_affiliate_ref";
export const AFFILIATE_VISIT_COOKIE = "mn_affiliate_visit";
export const AFFILIATE_PROOF_COOKIE = "mn_affiliate_proof";
export const AFFILIATE_MAX_AGE_SECONDS = 60 * 24 * 60 * 60;

export function normalizeAffiliateCode(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z0-9_-]{3,50}$/.test(normalized) ? normalized : null;
}

/**
 * Kept for rendering/tests that need to inspect harmless browser cookies.
 * Attribution itself is no longer stored here: the BFF owns the signed
 * HttpOnly proof cookie.
 */
export function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = encodeURIComponent(name) + "=";
  const entry = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

/** @deprecated Do not use for affiliate credentials; use the BFF route. */
export function writeAffiliateCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value)
    + "; Path=/; Max-Age=" + String(AFFILIATE_MAX_AGE_SECONDS) + "; SameSite=Lax" + secure;
}

export async function activateAffiliateReferral(codeInput: string): Promise<{ accepted: boolean; code: string | null }> {
  const code = normalizeAffiliateCode(codeInput);
  if (!code) return { accepted: false, code: null };

  const visitId = crypto.randomUUID();
  const response = await fetch("/api/affiliate/referral", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      affiliateCode: code,
      visitId,
      landingPath: (window.location.pathname + window.location.search).slice(0, 500),
      referrer: document.referrer.slice(0, 500) || undefined,
    }),
  });
  const result = await response.json().catch(() => ({ accepted: false }));
  if (!response.ok) throw new Error(result.detail ?? result.title ?? "Không thể ghi nhận mã giới thiệu.");
  if (!result.accepted) return { accepted: false, code };

  // The BFF commits the signed proof as an HttpOnly cookie only after the API
  // confirms the partner. No client-readable code/visit is trusted at checkout.
  return { accepted: true, code };
}
