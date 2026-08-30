"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Container } from "./container";
import { BrandLockup } from "@/components/brand/logo";
import { useTheme } from "@/components/theme/theme-provider";

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggle } = useTheme();
  const [categories, setCategories] = useState<import("@/features/catalog/types").Category[]>([]);

  useEffect(() => {
    let active = true;
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    
    import("@/features/catalog/api").then(({ getCategories }) => {
      getCategories().then((page) => {
        if (active) setCategories(page.items.filter((category) => category.sellablePlanCount > 0));
      }).catch(() => {});
    });

    return () => {
      active = false;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isTransparent = isHome && !scrolled;
  const isDark = theme === "dark";

  // Visual States Definition
  let headerBgClass = "border-b border-transparent bg-transparent";
  let searchContainerClass = "border-white/15 bg-white/8 focus-within:border-white/30 focus-within:bg-white/12";
  let searchInputClass = "text-white placeholder:text-white/50";
  let searchClearClass = "text-white/50 hover:text-white";
  let searchSubmitClass = "text-white/60 hover:text-white";
  let btnClass = "border border-white/15 text-white/75 hover:bg-white/10";
  let mobileMenuBg = "bg-transparent";
  let mobileLinkClass = "text-white/80 hover:bg-white/10 hover:text-white";

  if (!isTransparent || !isDark) {
    if (isDark) {
      headerBgClass = "backdrop-blur-2xl bg-slate-950/70 border-b border-white/5 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]";
      searchContainerClass = "border-white/10 bg-white/5 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/20";
      searchInputClass = "text-white placeholder:text-white/40";
      searchClearClass = "text-slate-400 hover:text-white";
      searchSubmitClass = "text-white/50 hover:text-cyan-400";
      btnClass = "border border-white/10 text-white/70 hover:bg-white/5";
      mobileMenuBg = "bg-slate-950";
      mobileLinkClass = "text-white/70 hover:bg-white/5 hover:text-white";
    } else {
      headerBgClass = "backdrop-blur-2xl bg-white/70 border-b border-slate-200 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]";
      searchContainerClass = "border-slate-200 bg-white/50 focus-within:border-river-500 focus-within:ring-2 focus-within:ring-river-500/20";
      searchInputClass = "text-slate-900 placeholder:text-slate-400";
      searchClearClass = "text-slate-400 hover:text-slate-900";
      searchSubmitClass = "text-slate-500 hover:text-river-600";
      btnClass = "border border-slate-200 text-slate-600 hover:bg-slate-50";
      mobileMenuBg = "bg-white";
      mobileLinkClass = "text-slate-600 hover:bg-slate-50 hover:text-river-700";
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/services?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${headerBgClass}`}>
      <Container className="flex min-h-[4.25rem] items-center justify-between gap-4">
        {/* Logo + Brand */}
        <Link href="/" className="group shrink-0" aria-label="MekongNode - Trang chủ">
          <BrandLockup
            markClassName="h-10 w-10 transition-transform duration-300 group-hover:scale-[1.06]"
            nameClassName="text-[1.05rem] sm:text-lg"
            tone={isDark ? "on-dark" : "on-light"}
          />
        </Link>

        {/* Search Bar — Center */}
        <form
          onSubmit={handleSearch}
          className={`hidden md:flex items-center flex-1 max-w-md mx-6 rounded-2xl border transition-all duration-200 ${searchContainerClass}`}
        >
          <input
            type="search"
            placeholder="Tìm kiếm gói dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent px-4 py-2.5 text-sm outline-none ${searchInputClass}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className={`px-2 text-sm transition-colors ${searchClearClass}`}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className={`flex h-10 w-10 items-center justify-center rounded-r-2xl transition-colors ${searchSubmitClass}`}
            aria-label="Tìm kiếm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        {/* Right: Theme Toggle + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Dark/Light Toggle */}
          <button
            type="button"
            onClick={toggle}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${btnClass}`}
            aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          >
            {theme === "dark" ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors md:hidden ${btnClass}`}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Đóng" : "Menu"}
          </button>
        </div>
      </Container>

      {/* Mobile Navigation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${mobileMenuBg} ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <Container>
          {/* Mobile search */}
          <form
            onSubmit={handleSearch}
            className={`mt-2 flex items-center rounded-2xl border ${searchContainerClass}`}
          >
            <input
              type="search"
              placeholder="Tìm kiếm gói dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent px-4 py-2.5 text-sm outline-none ${searchInputClass}`}
            />
            <button type="submit" className="px-4 py-2.5 text-slate-400" aria-label="Tìm kiếm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
            </button>
          </form>

          <nav
            id="mobile-navigation"
            aria-label="Điều hướng chính trên di động"
            className={`grid gap-1 border-t py-3 mt-2 ${!isTransparent && isDark ? "border-white/10" : "border-line-200"}`}
          >
            {([
              { icon: "⚡", label: "Bảng giá", href: "/pricing" },
              { icon: "🎁", label: "Ưu đãi", href: "/offers" },
              { icon: "📦", label: "Tra cứu đơn hàng", href: "/orders/track" },
              ...categories.map(c => ({
                icon: "🖥️",
                label: c.name,
                href: `/services?category=${encodeURIComponent(c.slug)}`
              })),
              { icon: "🔍", label: "Tư vấn gói", href: "/advisor" },
              { icon: "📝", label: "Blog", href: "/blog" },
              { icon: "💬", label: "Giới thiệu", href: "/about" },
              { icon: "📞", label: "Liên hệ", href: "/contact" },
            ]).map(({ icon, label, href }) => (
              <Link
                key={href}
                className={`min-h-11 flex items-center gap-3 rounded-xl px-4 py-2 font-medium transition-colors ${mobileLinkClass}`}
                href={href}
                onClick={() => setOpen(false)}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
    </header>
  );
}
