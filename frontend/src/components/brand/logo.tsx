"use client";

import Image from "next/image";
import { useId } from "react";
import { useBranding } from "./brand-provider";
import { apiAssetUrl } from "@/lib/api-client";

/**
 * MekongNode Logo — Tối giản: Cloud + Node mạng
 * Sử dụng: <Logo className="h-8 w-8" /> hoặc <Logo className="h-10 w-10 text-white" />
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  const { branding } = useBranding();
  const uploadedLogoUrl = apiAssetUrl(branding.logoUrl);
  const gradientId = useId();
  if (uploadedLogoUrl) {
    return <Image src={uploadedLogoUrl} alt={`${branding.brandName} logo`} width={40} height={40} unoptimized className={`${className} object-contain`} />;
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MekongNode logo"
    >
      {/* Cloud body */}
      <path
        d="M30.5 27H12a8 8 0 1 1 5.9-13.4A6.5 6.5 0 0 1 30.5 18a5.5 5.5 0 0 1 0 9z"
        fill={`url(#${gradientId})`}
        opacity="0.92"
      />
      {/* Node dots */}
      <circle cx="16" cy="21" r="2.2" fill="white" opacity="0.95" />
      <circle cx="24" cy="18" r="2.2" fill="white" opacity="0.95" />
      <circle cx="24" cy="25" r="2.2" fill="white" opacity="0.95" />
      {/* Node connections */}
      <line x1="16" y1="21" x2="24" y2="18" stroke="white" strokeWidth="1.2" opacity="0.7" />
      <line x1="16" y1="21" x2="24" y2="25" stroke="white" strokeWidth="1.2" opacity="0.7" />
      <line x1="24" y1="18" x2="24" y2="25" stroke="white" strokeWidth="1.2" opacity="0.7" />
      {/* Gradient definitions */}
      <defs>
        <linearGradient id={gradientId} x1="8" y1="12" x2="36" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e66a5" />
          <stop offset="0.5" stopColor="#2a80c9" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}
