"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type ElementType, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bell, Camera, ChevronDown, CreditCard, FileText, KeyRound, LayoutDashboard, LogOut, Mail, Menu, PanelLeftClose, PanelLeftOpen, RotateCcw, Server, ShoppingCart, Star, Tag, Users, UserRound, UploadCloud } from "lucide-react";
import { currentSession, logout, type SessionUser } from "@/features/auth/session-client";
import { getDashboard } from "@/features/dashboard/api";
import { resetBrandLogo, uploadBrandLogo } from "@/features/branding/api";
import { Logo } from "@/components/brand/logo";
import { useBranding } from "@/components/brand/brand-provider";
import { apiAssetUrl } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type Role = "Admin" | "Editor";
type Item = { label: string; href: string; icon: ElementType; roles: readonly Role[] };
type Notice = { id: number; title: string; detail: string; href: string; time: string; read: boolean; tone: "blue" | "amber" | "rose" | "emerald"; icon: ElementType };

const navGroups: { label: string; items: Item[] }[] = [
  { label: "Điều hành", items: [
    { label: "Tổng quan", href: "/admin", icon: LayoutDashboard, roles: ["Admin", "Editor"] },
    { label: "Đơn dịch vụ", href: "/admin/order-requests", icon: ShoppingCart, roles: ["Admin", "Editor"] },
    { label: "Affiliate", href: "/admin/affiliate-applications", icon: Users, roles: ["Admin", "Editor"] },
    { label: "Liên hệ", href: "/admin/contact-requests", icon: Mail, roles: ["Admin", "Editor"] },
  ] },
  { label: "Danh mục", items: [
    { label: "Danh mục dịch vụ", href: "/admin/service-categories", icon: Server, roles: ["Admin"] },
    { label: "Gói dịch vụ", href: "/admin/service-plans", icon: Server, roles: ["Admin"] },
    { label: "Bảng giá", href: "/admin/plan-prices", icon: CreditCard, roles: ["Admin"] },
    { label: "Khuyến mãi", href: "/admin/promotions", icon: Tag, roles: ["Admin"] },
  ] },
  { label: "Nội dung", items: [
    { label: "Danh mục tin", href: "/admin/news-categories", icon: FileText, roles: ["Admin", "Editor"] },
    { label: "Bài viết", href: "/admin/news-articles", icon: FileText, roles: ["Admin", "Editor"] },
    { label: "Đánh giá", href: "/admin/testimonials", icon: Star, roles: ["Admin"] },
  ] },
  { label: "Hệ thống", items: [
    { label: "Nhật ký hoạt động", href: "/admin/audit-logs", icon: Activity, roles: ["Admin"] },
    { label: "Đổi mật khẩu", href: "/admin/change-password", icon: KeyRound, roles: ["Admin", "Editor"] },
  ] },
];

const noticeTone = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
};

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function canAccess(pathname: string, role: string) {
  if (role === "Admin") return true;
  return ["/admin", "/admin/order-requests", "/admin/affiliate-applications", "/admin/contact-requests", "/admin/news-categories", "/admin/news-articles", "/admin/change-password", "/admin/profile"].includes(pathname);
}

function userInitials(user: SessionUser) {
  return (user.fullName || user.userName).trim().split(/\s+/).slice(0, 2).map((value) => value[0]).join("").toUpperCase();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(pathname !== "/admin/login");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(navGroups.map((group) => [group.label, true])));
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const { branding, setBranding } = useBranding();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    let mounted = true;
    currentSession().then(async (session) => {
      if (!mounted) return;
      setUser(session.user);
      try {
        const dashboard = await getDashboard();
        if (!mounted) return;
        const notices: Notice[] = [];
        if (dashboard.summary.newOrders > 0) notices.push({ id: 1, title: "Đơn dịch vụ mới", detail: `${dashboard.summary.newOrders} đơn đang chờ tiếp nhận.`, href: "/admin/order-requests", time: "Dữ liệu hiện tại", read: false, tone: "blue", icon: ShoppingCart });
        if (dashboard.summary.newAffiliateApplications > 0) notices.push({ id: 2, title: "Affiliate cần duyệt", detail: `${dashboard.summary.newAffiliateApplications} hồ sơ đối tác đang ở trạng thái mới.`, href: "/admin/affiliate-applications", time: "Dữ liệu hiện tại", read: false, tone: "amber", icon: Users });
        if (dashboard.summary.newContacts > 0) notices.push({ id: 3, title: "Liên hệ chưa đọc", detail: `${dashboard.summary.newContacts} yêu cầu liên hệ cần phân công.`, href: "/admin/contact-requests", time: "Dữ liệu hiện tại", read: false, tone: "rose", icon: Mail });
        setNotifications(notices);
      } catch {
        if (mounted) setNotifications([]);
      }
    }).catch(() => router.replace("/admin/login?returnUrl=" + encodeURIComponent(pathname))).finally(() => { if (mounted) setCheckingSession(false); });

    return () => { mounted = false; };
  }, [isLogin, pathname, router]);

  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key === "Escape") { setShowNotifications(false); setShowProfile(false); }
    }
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);

  useEffect(() => {
    if (isLogin || !user) return;
    let timer: NodeJS.Timeout;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout().finally(() => {
          router.replace("/admin/login");
          router.refresh();
        });
      }, 60 * 60 * 1000); // 60 minutes
    };
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [isLogin, user, router]);

  if (isLogin) return children;
  if (checkingSession || !user) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 dark:from-slate-950 dark:to-slate-900"><p className="flex items-center gap-3 text-sm font-semibold text-slate-500 dark:text-white/60" role="status"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-river-500" />Đang thiết lập không gian quản trị</p></main>;
  if (!canAccess(pathname, user.role)) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-50 to-slate-100 px-6 dark:from-slate-950 dark:to-slate-900"><p className="text-sm font-semibold text-slate-500 dark:text-white/60">Bạn đang được chuyển đến khu vực phù hợp với quyền truy cập.</p></main>;

  const role = user.role as Role;
  const source = apiAssetUrl(user.avatarUrl);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const pageTitle = navGroups.flatMap((group) => group.items).find((item) => isActive(pathname, item.href))?.label ?? "Tổng quan";

  async function signOut() {
    try { await logout(); } finally { router.replace("/admin/login"); router.refresh(); }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError("");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/admin/profile/avatar", { method: "POST", body });
      if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { detail?: string; title?: string };
        throw new Error(problem.detail ?? problem.title ?? "Không thể tải ảnh đại diện.");
      }
      const data = await response.json() as { avatarUrl: string };
      setUser((current) => current ? { ...current, avatarUrl: data.avatarUrl } : null);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Không thể tải ảnh đại diện.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function uploadAdminLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setUploadError("");
    try {
      setBranding(await uploadBrandLogo(file));
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Không thể tải logo lên.");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function restoreDefaultLogo() {
    setIsUploadingLogo(true);
    setUploadError("");
    try {
      setBranding(await resetBrandLogo());
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Không thể khôi phục logo mặc định.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function openNotice(notice: Notice) {
    setNotifications((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item));
    setShowNotifications(false);
    router.push(notice.href);
  }

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-950 selection:bg-river-500/20 dark:from-slate-950 dark:to-slate-900 dark:text-white">
    {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" aria-label="Đóng menu quản trị" onClick={() => setMobileOpen(false)} />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 w-[296px] overflow-x-hidden border-r border-slate-200 bg-white/70 shadow-[10px_0_35px_-24px_rgba(15,23,42,0.26)] backdrop-blur-2xl transition-[width,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-black/40 dark:shadow-[10px_0_35px_-24px_rgba(0,0,0,0.7)] lg:translate-x-0", isCollapsed && "lg:w-20", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className={cn("flex min-h-full flex-col py-5", isCollapsed ? "px-3" : "px-4 sm:px-5")}>
        <div className={cn("flex min-h-11 items-center", isCollapsed ? "justify-between lg:justify-center" : "justify-between")}>
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Cập nhật logo dùng chung" onClick={() => logoInputRef.current?.click()} className="group/logo relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.45)] ring-1 ring-slate-200 transition-all hover:scale-105 dark:bg-slate-900 dark:ring-white/10">
              <Logo className="h-9 w-9" />
              <span className="absolute inset-0 grid place-items-center bg-slate-950/65 text-white opacity-0 transition-opacity group-hover/logo:opacity-100">{isUploadingLogo ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <UploadCloud size={15} />}</span>
            </button>
            <input ref={logoInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadAdminLogo} />
            <Link href="/admin" onClick={() => setMobileOpen(false)} className={cn("overflow-hidden whitespace-nowrap text-lg font-bold tracking-tight transition-all duration-300", isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100")}>Mekong<span className="text-river-600">Node</span></Link>
            {branding.logoUrl && !isCollapsed && <button type="button" onClick={() => void restoreDefaultLogo()} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-river-700 dark:hover:bg-white/10 dark:hover:text-cyan-300" aria-label="Khôi phục logo MekongNode mặc định" title="Khôi phục logo mặc định"><RotateCcw size={14} /></button>}
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white hover:shadow-lg ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-white/60 dark:hover:bg-white dark:hover:text-slate-950 lg:hidden" aria-label="Đóng menu quản trị" onClick={() => setMobileOpen(false)}><PanelLeftClose size={18} /></button>
        </div>

        <div className={cn("mt-7 rounded-2xl border border-white/70 bg-white/60 p-3 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.38)] dark:border-white/10 dark:bg-white/5", isCollapsed && "lg:p-2")}>
          <div className={cn("flex items-center gap-3", isCollapsed && "lg:justify-center")}>
            <button type="button" className="group/avatar relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:ring-white/10" aria-label="Cập nhật ảnh đại diện" onClick={() => fileInputRef.current?.click()}>
              {source ? <Image src={source} alt="Ảnh đại diện" fill sizes="40px" className="object-cover" unoptimized /> : <span className="grid h-full w-full place-items-center bg-gradient-to-br from-river-600 to-cyan-500 text-xs font-bold text-white">{userInitials(user)}</span>}
              <span className="absolute inset-0 grid place-items-center bg-slate-950/65 text-white opacity-0 transition-opacity group-hover/avatar:opacity-100">{isUploading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera size={15} />}</span>
            </button>
            <div className={cn("min-w-0 overflow-hidden transition-all duration-300", isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100")}><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.fullName || user.userName}</p><p className="mt-0.5 text-xs font-medium text-river-600 dark:text-cyan-300">{user.role}</p></div>
          </div>
          <input ref={fileInputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadAvatar} />
        </div>

        <nav className="mt-7 flex-1 space-y-4" aria-label="Điều hướng quản trị">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => item.roles.includes(role));
            const groupOpen = openGroups[group.label] || items.some((item) => isActive(pathname, item.href));
            if (!items.length) return null;
            return <section key={group.label}>
              <button type="button" aria-expanded={groupOpen} onClick={() => setOpenGroups((current) => ({ ...current, [group.label]: !current[group.label] }))} className={cn("mb-2 flex w-full items-center justify-between px-2 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-700 transition-colors hover:text-slate-900 dark:text-white/80 dark:hover:text-white", isCollapsed && "lg:hidden")}><span>{group.label}</span><ChevronDown size={14} className={cn("transition-transform duration-300 text-slate-400", groupOpen && "rotate-180")} /></button>
              <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", isCollapsed || groupOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="overflow-hidden"><div className="grid gap-1">
                {items.map((item) => {
                  const selected = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={isCollapsed ? item.label : undefined} className={cn("group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-lg", isCollapsed && "lg:justify-center lg:px-0", selected ? "bg-slate-950 text-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.8)] dark:bg-white dark:text-slate-950" : "text-slate-500 hover:bg-white hover:text-slate-950 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white")}>{selected && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95)] dark:bg-cyan-400" />}<Icon size={18} className={cn("shrink-0", selected ? "text-cyan-300 dark:text-river-600" : "text-slate-400 group-hover:text-river-600 dark:text-white/40 dark:group-hover:text-cyan-300")} /><span className={cn("whitespace-nowrap transition-all duration-300", isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100")}>{item.label}</span></Link>;
                })}
              </div></div></div>
            </section>;
          })}
        </nav>
        <button type="button" className={cn("mt-5 hidden min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 lg:flex", isCollapsed && "lg:px-0")} onClick={() => setIsCollapsed((value) => !value)} aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}>{isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span className={cn("whitespace-nowrap transition-all duration-300", isCollapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100")}>Thu gọn</span></button>
      </div>
    </aside>

    <div className={cn("min-h-screen transition-[margin] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:ml-[296px]", isCollapsed && "lg:ml-20")}>
      {uploadError && <div role="alert" className="fixed right-4 top-4 z-[70] max-w-md rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-xl dark:border-rose-400/20 dark:bg-slate-950 dark:text-rose-300"><button type="button" className="mr-3" onClick={() => setUploadError("")} aria-label="Đóng thông báo">×</button>{uploadError}</div>}
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/50 px-4 backdrop-blur-2xl sm:px-6 lg:px-8 dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex min-w-0 items-center gap-3"><button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-lg ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white lg:hidden" aria-label="Mở menu quản trị" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="min-w-0"><p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block dark:text-white/40">MekongNode / Workspace</p><h1 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:mt-0.5 sm:text-base dark:text-white">{pageTitle}</h1></div></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative"><button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950 hover:shadow-lg ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white" aria-label={"Thông báo, " + unreadCount + " chưa đọc"} aria-expanded={showNotifications} onClick={() => { setShowNotifications((value) => !value); setShowProfile(false); }}><Bell size={19} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-950">{unreadCount}</span>}</button>
            {showNotifications && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.55)]"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-white/10"><div><p className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</p><p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">{unreadCount ? unreadCount + " mục cần chú ý" : "Không có hồ sơ mới cần xử lý"}</p></div><button type="button" className="text-xs font-semibold text-river-600 disabled:opacity-40 dark:text-cyan-300" onClick={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))} disabled={!unreadCount}>Đọc tất cả</button></div><div className="max-h-[min(28rem,calc(100vh-8rem))] overflow-y-auto p-2">{notifications.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500 dark:text-white/50">Số liệu dashboard hiện không có mục mới.</p>}{notifications.map((notice) => { const Icon = notice.icon; return <button key={notice.id} type="button" onClick={() => openNotice(notice)} className={cn("flex w-full items-start gap-3 rounded-xl p-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm ease-[cubic-bezier(0.16,1,0.3,1)] dark:hover:bg-white/5", !notice.read && "bg-river-50/70 dark:bg-cyan-400/5")}><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", noticeTone[notice.tone])}><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold text-slate-800 dark:text-white">{notice.title}</span>{!notice.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-river-500" />}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-white/50">{notice.detail}</span><span className="mt-1.5 block text-[11px] font-medium text-slate-400 dark:text-white/35">{notice.time}</span></span></button>; })}</div></div>}
          </div>
          <div className="relative"><button type="button" className="flex h-10 items-center gap-2 rounded-xl px-1.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg ease-[cubic-bezier(0.16,1,0.3,1)] dark:hover:bg-white/10" aria-label="Mở menu tài khoản" aria-expanded={showProfile} onClick={() => { setShowProfile((value) => !value); setShowNotifications(false); }}><span className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-transparent bg-slate-950 text-white dark:bg-white dark:text-slate-950">{source ? <Image src={source} alt="Ảnh đại diện" fill sizes="32px" className="object-cover" unoptimized /> : <span className="grid h-full w-full place-items-center text-[10px] font-bold">{userInitials(user)}</span>}</span><span className="hidden max-w-32 min-w-0 sm:block"><span className="block truncate text-xs font-bold text-slate-800 dark:text-white">{user.fullName || user.userName}</span><span className="block truncate text-[10px] font-medium text-slate-400 dark:text-white/45">{user.role}</span></span><ChevronDown size={15} className="hidden text-slate-400 sm:block dark:text-white/45" /></button>
            {showProfile && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-64 overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.55)]"><div className="border-b border-slate-100 px-3 py-3 dark:border-white/10"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.fullName || user.userName}</p><p className="mt-0.5 truncate text-xs text-slate-500 dark:text-white/50">{user.email}</p></div><div className="mt-1 grid gap-1"><button type="button" onClick={() => { setShowProfile(false); router.push("/admin/profile"); }} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"><UserRound size={17} />Thông tin</button><Link href="/admin/change-password" onClick={() => setShowProfile(false)} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"><KeyRound size={17} />Đổi mật khẩu</Link><button type="button" onClick={signOut} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"><LogOut size={17} />Đăng xuất</button></div></div>}
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-76px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>;
}
