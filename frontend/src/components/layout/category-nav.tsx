"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { BadgeDollarSign, BookOpen, CircleHelp, Contact, PackageSearch } from "lucide-react";
import { CategoryIcon } from "@/components/brand/category-icon";
import { getCategories } from "@/features/catalog/api";
import type { Category } from "@/features/catalog/types";

type FixedLink = { label: string; href: string; icon: ComponentType<{ size?: number; strokeWidth?: number }> };

const fixedLinks: FixedLink[] = [
  { label: "Bảng giá", href: "/pricing", icon: BadgeDollarSign },
  { label: "Tra cứu đơn", href: "/orders/track", icon: PackageSearch },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "Giới thiệu", href: "/about", icon: CircleHelp },
  { label: "Liên hệ", href: "/contact", icon: Contact },
];

function pillClass(active: boolean) {
  return `category-pill flex min-h-9 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b8bd8] ${
    active
      ? "border-[#075f9d] bg-[linear-gradient(115deg,#054b7b_0%,#075f9d_52%,#087ac1_100%)] text-white shadow-[0_10px_24px_-14px_rgba(11,139,216,.9),inset_0_1px_0_rgba(255,255,255,.24)]"
      : "border-transparent bg-transparent text-[#3e566d] hover:-translate-y-px hover:border-[#c9deec] hover:bg-[#edf8ff] hover:text-[#075f9d] dark:text-[#b8c9db] dark:hover:border-white/[0.12] dark:hover:bg-white/[0.07] dark:hover:text-white"
  }`;
}

export function CategoryNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((page) => {
        if (active) setCategories(page.items.filter((category) => category.sellablePlanCount > 0));
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => { active = false; };
  }, []);

  function renderLinks(isCopy: boolean) {
    const suffix = isCopy ? "-copy" : "";
    return (
      <>
        {fixedLinks.slice(0, 1).map(({ label, href, icon: Icon }) => (
          <Link key={`${href}${suffix}`} tabIndex={isCopy ? -1 : undefined} href={href} aria-current={!isCopy && pathname === href ? "page" : undefined} className={pillClass(pathname === href)}>
            <Icon size={16} strokeWidth={1.8} />{label}
          </Link>
        ))}

        {categories.map((category) => {
          const active = pathname === "/services" && currentCategory === category.slug;
          return (
            <Link
              key={`${category.id}${suffix}`}
              tabIndex={isCopy ? -1 : undefined}
              href={`/services?category=${encodeURIComponent(category.slug)}`}
              aria-current={!isCopy && active ? "page" : undefined}
              className={pillClass(active)}
            >
              <CategoryIcon iconKey={category.icon} slug={category.slug} size={16} />
              {category.name}
            </Link>
          );
        })}

        {fixedLinks.slice(1).map(({ label, href, icon: Icon }) => (
          <Link key={`${href}${suffix}`} tabIndex={isCopy ? -1 : undefined} href={href} aria-current={!isCopy && pathname === href ? "page" : undefined} className={pillClass(pathname === href)}>
            <Icon size={16} strokeWidth={1.8} />{label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="fixed top-[4.25rem] z-40 w-full border-b border-[#d8e7f2]/90 bg-[#f5faff]/94 shadow-[0_14px_34px_-30px_rgba(8,72,114,.55)] backdrop-blur-2xl transition-colors duration-300 dark:border-white/[0.07] dark:bg-[#07101f]/88 dark:shadow-[0_18px_40px_-30px_rgba(0,0,0,.95)]">
      <div className="mx-auto w-full max-w-[75rem] px-4 md:px-6">
        <nav
          aria-label="Danh mục nhanh"
          className="category-marquee-viewport scrollbar-hide my-2 snap-x snap-mandatory overflow-x-auto rounded-2xl border border-[#d6e6f1]/95 bg-white/88 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_10px_34px_-28px_rgba(8,72,114,.7)] dark:border-white/[0.08] dark:bg-white/[0.035] dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
          <div className="category-marquee-track flex w-max items-center">
            <div className="flex items-center gap-1.5 pr-1.5">{renderLinks(false)}</div>
            <div className="category-marquee-copy flex items-center gap-1.5 pr-1.5" aria-hidden="true">{renderLinks(true)}</div>
          </div>
        </nav>
      </div>
    </div>
  );
}
