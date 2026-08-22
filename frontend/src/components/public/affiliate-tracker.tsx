"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackAffiliateReferral } from "@/features/affiliates/api";
import {
  AFFILIATE_CODE_COOKIE,
  AFFILIATE_VISIT_COOKIE,
  normalizeAffiliateCode,
  readBrowserCookie,
  writeAffiliateCookie,
} from "@/features/affiliates/tracking";

export function AffiliateTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    const code = normalizeAffiliateCode(ref);
    if (!code) return;

    const previousCode = normalizeAffiliateCode(readBrowserCookie(AFFILIATE_CODE_COOKIE));
    const previousVisit = readBrowserCookie(AFFILIATE_VISIT_COOKIE);
    const visitId = previousCode === code && previousVisit && /^[0-9a-f-]{36}$/i.test(previousVisit)
      ? previousVisit
      : crypto.randomUUID();

    writeAffiliateCookie(AFFILIATE_CODE_COOKIE, code);
    writeAffiliateCookie(AFFILIATE_VISIT_COOKIE, visitId);

    void trackAffiliateReferral({
      affiliateCode: code,
      visitId,
      landingPath: `${pathname}${window.location.search}`.slice(0, 500),
      referrer: document.referrer.slice(0, 500) || undefined,
    }).catch(() => {
      // Attribution remains in the cookie and checkout can still validate it.
      // A temporary analytics failure must never block page navigation.
    });
  }, [pathname, ref]);

  return null;
}
