"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { activateAffiliateReferral, normalizeAffiliateCode } from "@/features/affiliates/tracking";

export function AffiliateTracker() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    const code = normalizeAffiliateCode(ref);
    if (!code) return;
    void activateAffiliateReferral(code).catch(() => {
      // Attribution is best-effort analytics; a transient tracking outage must
      // never block page navigation or turn an unverified code into a cookie.
    });
  }, [ref]);

  return null;
}
