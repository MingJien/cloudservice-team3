"use client";

import Image from "next/image";
import { useBranding } from "./brand-provider";
import { apiAssetUrl } from "@/lib/api-client";

type BrandTone = "on-light" | "on-dark" | "adaptive";

/**
 * Biểu tượng mặc định của MekongNode.
 *
 * Khối M gợi dòng chảy Mekong, hai điểm neo gợi hạ tầng được kết nối.
 * Chỉ dùng hai sắc độ xanh để giữ nhận diện B2B rõ ràng ở kích thước nhỏ.
 */
export function Logo({ className = "h-8 w-8", tone = "adaptive" }: { className?: string; tone?: BrandTone }) {
  const { branding } = useBranding();
  const uploadedLogoUrl = apiAssetUrl(branding.logoUrl);
  const colorClass = tone === "on-dark"
    ? "text-[#67DDF3]"
    : tone === "on-light"
      ? "text-[#087EBA]"
      : "text-[#087EBA] dark:text-[#67DDF3]";
  if (uploadedLogoUrl) {
    return <Image src={uploadedLogoUrl} alt={`${branding.brandName} logo`} width={40} height={40} unoptimized className={`${className} object-contain`} />;
  }

  return (
    <svg
      viewBox="0 0 112 112"
      fill="none"
      className={`${className} ${colorClass} overflow-visible`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M29 82h53.5c13.5 0 24.5-10.4 24.5-23.4 0-12.2-9.7-22.3-22.1-23.4C79.5 21.4 68.1 13 54.7 13 40.1 13 28 22.8 25.1 36.1 14.7 38.8 7 47.8 7 58.5 7 71.5 17.5 82 29 82Z" fill="currentColor" opacity=".12" />
      <path d="M29 82h53.5c13.5 0 24.5-10.4 24.5-23.4 0-12.2-9.7-22.3-22.1-23.4C79.5 21.4 68.1 13 54.7 13 40.1 13 28 22.8 25.1 36.1 14.7 38.8 7 47.8 7 58.5 7 71.5 17.5 82 29 82Z" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M35 61h42M56 43v18M44 74l12-13 12 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="61" r="5" fill="currentColor" />
      <circle cx="77" cy="61" r="5" fill="currentColor" />
      <circle cx="56" cy="43" r="5" fill="currentColor" />
      <circle cx="44" cy="74" r="5" fill="currentColor" />
      <circle cx="68" cy="74" r="5" fill="currentColor" />
    </svg>
  );
}

export function BrandLockup({
  className = "",
  markClassName = "h-10 w-10",
  nameClassName = "text-lg",
  tone = "adaptive",
}: {
  className?: string;
  markClassName?: string;
  nameClassName?: string;
  tone?: BrandTone;
}) {
  const { branding } = useBranding();
  const brandName = branding.brandName.trim() || "MekongNode";
  const isDefaultName = brandName.toLocaleLowerCase("vi-VN") === "mekongnode";
  const primaryClass = tone === "on-dark"
    ? "text-white"
    : tone === "on-light"
      ? "text-[#10233A]"
      : "text-[#10233A] dark:text-white";
  const accentClass = tone === "on-dark"
    ? "text-[#67DDF3]"
    : tone === "on-light"
      ? "text-[#087EBA]"
      : "text-[#087EBA] dark:text-[#67DDF3]";

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <Logo className={markClassName} tone={tone} />
      <span className={`${nameClassName} whitespace-nowrap font-extrabold tracking-[-0.045em]`}>
        {isDefaultName ? <><span className={primaryClass}>Mekong</span><span className={accentClass}>Node</span></> : <span className={primaryClass}>{brandName}</span>}
      </span>
    </span>
  );
}
