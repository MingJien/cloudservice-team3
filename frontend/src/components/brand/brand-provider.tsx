"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getBranding, type Branding } from "@/features/branding/api";

const defaultBranding: Branding = { brandName: "MekongNode", logoUrl: null, updatedAt: null };

type BrandContextValue = {
  branding: Branding;
  refreshBranding: () => Promise<void>;
  setBranding: (branding: Branding) => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [branding, setBrandingState] = useState(defaultBranding);
  const setBranding = useCallback((next: Branding) => {
    setBrandingState(next);
    window.dispatchEvent(new CustomEvent<Branding>("cloudservice:branding-updated", { detail: next }));
  }, []);
  const refreshBranding = useCallback(async () => {
    try {
      setBranding(await getBranding());
    } catch {
      setBranding(defaultBranding);
    }
  }, [setBranding]);

  useEffect(() => {
    let active = true;
    getBranding().then((result) => { if (active) setBrandingState(result); }).catch(() => { if (active) setBrandingState(defaultBranding); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function synchronize(event: Event) {
      setBrandingState((event as CustomEvent<Branding>).detail);
    }
    window.addEventListener("cloudservice:branding-updated", synchronize);
    return () => window.removeEventListener("cloudservice:branding-updated", synchronize);
  }, []);

  const value = useMemo(() => ({ branding, refreshBranding, setBranding }), [branding, refreshBranding, setBranding]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBranding() {
  const value = useContext(BrandContext);
  if (!value) throw new Error("useBranding must be used inside BrandProvider.");
  return value;
}
