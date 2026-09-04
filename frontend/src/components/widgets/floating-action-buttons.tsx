"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function personalZaloUrl(): string | null {
  const digits = (process.env.NEXT_PUBLIC_ZALO_PHONE ?? "").replace(/\D/g, "");
  return /^\d{9,15}$/.test(digits) ? `https://zalo.me/${digits}` : null;
}

export function FloatingActionButtons() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(pathname !== "/");
  const lastY = useRef(0);
  const zaloUrl = personalZaloUrl();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (pathname === "/" && y < 520) {
        setVisible(false);
      } else if (window.innerWidth < 768) {
        setVisible(y < lastY.current || y < 100);
      } else {
        setVisible(true);
      }
      lastY.current = y;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <aside
      aria-label="Hỗ trợ nhanh"
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-3 transition-all duration-300 sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <Link
        href="/offers"
        aria-label="Xem ưu đãi và voucher đang áp dụng"
        className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#9dd0e4] bg-white shadow-[0_16px_38px_-18px_rgba(8,114,180,.75)] transition-all animate-wiggle hover:-translate-y-1 hover:rotate-[-2deg] dark:border-[#67e8f9]/25 dark:bg-[#102136]"
      >
        <Image src="/images/gift-box.svg" alt="" width={42} height={42} className="h-10 w-10" />
        <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-ink-950">Xem ưu đãi</span>
      </Link>
      <Link
        href="/advisor"
        aria-label="Mở công cụ tư vấn chọn gói cloud"
        className="group flex min-h-12 items-center gap-2 rounded-2xl border border-[#b8d7e9] bg-white px-4 text-sm font-bold text-[#075f9d] shadow-[0_14px_34px_-18px_rgba(8,72,114,.62)] transition-all hover:-translate-y-0.5 hover:border-[#78b9db] hover:bg-[#f4fbff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0b8bd8] dark:border-white/12 dark:bg-[#102136] dark:text-[#8ee8f2] dark:hover:bg-[#142b45]"
      >
        <span className="h-2 w-2 rounded-full bg-[#13a37f] shadow-[0_0_0_4px_rgba(19,163,127,.12)]" aria-hidden="true" />
        <span>Tư vấn gói</span>
      </Link>

      {zaloUrl && (
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mở trang cá nhân Zalo để nhắn tin"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0068ff] shadow-[0_16px_42px_-14px_rgba(0,104,255,.75)] transition-all hover:-translate-y-1 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0068ff]"
        >
          <span className="pointer-events-none absolute -inset-1 rounded-full border border-[#0068ff]/40 motion-safe:animate-pulse" />
          <Image src="/images/zalo.png" alt="Zalo" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-ink-950">
            Chat Zalo cá nhân
          </span>
        </a>
      )}
    </aside>
  );
}
