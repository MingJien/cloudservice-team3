"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const menuGroups = [
  { label: "Catalog", items: [["Danh mục", "/admin/service-categories"], ["Gói dịch vụ", "/admin/service-plans"], ["Bảng giá", "/admin/plan-prices"], ["Khuyến mãi", "/admin/promotions"]] },
  { label: "Content", items: [["Danh mục tin", "/admin/news-categories"], ["Bài viết", "/admin/news-articles"], ["Đánh giá", "/admin/testimonials"]] },
  { label: "Requests", items: [["Đơn dịch vụ", "/admin/order-requests"], ["Affiliate", "/admin/affiliate-applications"], ["Liên hệ", "/admin/contact-requests"]] },
  { label: "System", items: [["Nhật ký", "/admin/audit-logs"]] },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname === "/admin/login") return children;

  return (
    <div className="min-h-screen bg-paper-50 lg:grid lg:grid-cols-[256px_1fr]">
      {open && <button className="fixed inset-0 z-30 bg-ink-950/45 lg:hidden" aria-label="Đóng menu" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-ink-950 px-4 py-6 text-white transition-transform lg:static lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <Link href="/admin" className="px-3 text-lg font-bold">MekongNode Admin</Link>
        <nav className="mt-8 grid gap-6" aria-label="Điều hướng quản trị">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/45">{group.label}</p>
              <div className="mt-2 grid gap-1">
                {group.items.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("rounded-xl px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 hover:text-white", pathname === href && "bg-river-600 text-white")}>{label}</Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-line-200 bg-white px-4 md:px-6">
          <button type="button" className="min-h-11 rounded-xl border border-line-200 px-3 text-sm font-semibold lg:hidden" onClick={() => setOpen(true)} aria-expanded={open}>Menu</button>
          <p className="hidden text-sm text-slate-600 sm:block">Trang quản trị / <span className="text-ink-950">Nền móng</span></p>
          <div className="text-right text-sm"><p className="font-semibold">Tài khoản demo</p><p className="text-xs text-slate-600">Admin / Editor</p></div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
