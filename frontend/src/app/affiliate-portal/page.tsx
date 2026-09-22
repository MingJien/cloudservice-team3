"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Award, Banknote, Clock3, Copy, LogOut, MousePointerClick, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { BrandLockup } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword, currentSession, logout, type SessionUser } from "@/features/auth/session-client";
import { getAffiliateDashboard, getAffiliateOrders, getAffiliatePayouts, requestAffiliatePayout, type AffiliateDashboard, type AffiliateOrder, type AffiliatePayout, type AffiliateTier, type CommissionStatus, type PayoutStatus } from "@/features/affiliates/portal-api";
import type { Page } from "@/features/catalog/types";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("vi-VN");
const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const weekLabel = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });
const reveal = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: .55, ease: [0.16, 1, 0.3, 1] as const } };

const tierDesign: Record<AffiliateTier, { label: string; ring: string; tint: string; text: string }> = {
  Newbie: { label: "Tân binh", ring: "from-sky-300 to-cyan-500", tint: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-300" },
  Bronze: { label: "Đồng", ring: "from-[#d99057] to-[#9a5c32]", tint: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-300" },
  Silver: { label: "Bạc", ring: "from-[#f8fafc] via-[#a8bdcf] to-[#eef6fb]", tint: "bg-slate-400/10", text: "text-slate-700 dark:text-slate-200" },
  Gold: { label: "Vàng", ring: "from-[#fff0a6] via-[#d9a514] to-[#fff4bd]", tint: "bg-amber-400/10", text: "text-amber-700 dark:text-amber-300" },
};

function statusLabel(status: CommissionStatus | PayoutStatus) {
  return ({ Pending: "Đang giữ", Eligible: "Khả dụng", Paid: "Đã trả", Rejected: "Từ chối", Requested: "Đã gửi", Processing: "Đối soát" } as Record<string, string>)[status] ?? status;
}

function statusClass(status: CommissionStatus | PayoutStatus) {
  if (status === "Paid" || status === "Eligible") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "Rejected") return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

export default function AffiliatePortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [orders, setOrders] = useState<Page<AffiliateOrder> | null>(null);
  const [payouts, setPayouts] = useState<Page<AffiliatePayout> | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [bank, setBank] = useState({ bankName: "", bankAccountNumber: "", bankAccountName: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    currentSession().then((session) => {
      if (!active) return;
      if (session.user.role !== "Affiliate") { router.replace("/admin/login"); return; }
      setUser(session.user);
      return Promise.all([getAffiliateDashboard(), getAffiliateOrders(orderPage), getAffiliatePayouts(payoutPage)]).then(([summary, orderData, payoutData]) => {
        if (active) { setDashboard(summary); setOrders(orderData); setPayouts(payoutData); setError(""); }
      });
    }).catch(() => router.replace("/affiliate/login")).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orderPage, payoutPage, router]);

  async function requestWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWithdrawBusy(true); setWithdrawError("");
    try {
      await requestAffiliatePayout(bank);
      const [summary, payoutData] = await Promise.all([getAffiliateDashboard(), getAffiliatePayouts(1)]);
      setDashboard(summary); setPayouts(payoutData); setPayoutPage(1); setWithdrawOpen(false); setBank({ bankName: "", bankAccountNumber: "", bankAccountName: "" });
    } catch (caught) { setWithdrawError(caught instanceof Error ? caught.message : "Không thể gửi yêu cầu rút tiền."); }
    finally { setWithdrawBusy(false); }
  }

  async function forceChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordError("");
    if (passwords.next !== passwords.confirm) { setPasswordError("Xác nhận mật khẩu mới chưa khớp."); return; }
    setPasswordBusy(true);
    try { await changePassword(passwords.current, passwords.next); await logout().catch(() => undefined); router.replace("/affiliate/login?passwordChanged=1"); }
    catch (caught) { setPasswordError(caught instanceof Error ? caught.message : "Không thể đổi mật khẩu."); }
    finally { setPasswordBusy(false); }
  }

  async function signOut() { await logout().catch(() => undefined); router.replace("/affiliate/login"); router.refresh(); }

  if (loading || !user || !dashboard) return <main className="grid min-h-screen place-items-center bg-[#f4faff] dark:bg-[#07101f]"><p className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-300"><span className="size-2.5 animate-pulse rounded-full bg-[#0b8bd8]" />Đang đồng bộ sổ cái đối tác</p></main>;
  const design = tierDesign[dashboard.tier];
  const progress = dashboard.nextTier ? Math.max(8, Math.min(94, 100 - dashboard.ordersUntilNextTier * 2)) : 100;
  const timelineMaximum = Math.max(...dashboard.weeklyPerformance.map((item) => item.completedOrders), 1);
  const hasTimelineData = dashboard.weeklyPerformance.length > 0;

  return <main className="min-h-screen overflow-hidden bg-[#f4faff] font-sans text-[#07101f] selection:bg-[#22d3ee]/20 dark:bg-[#07101f] dark:text-white">
    <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(7,95,157,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(7,95,157,.045)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(103,232,249,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.025)_1px,transparent_1px)] dark:bg-[size:48px_48px]" />
    <header className="sticky top-0 z-30 border-b border-[#cfe1ec]/75 bg-white/80 backdrop-blur-2xl dark:border-white/[0.07] dark:bg-[#07101f]/82"><div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-7"><Link href="/"><BrandLockup tone="adaptive" /></Link><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><strong className="block text-sm">{user.fullName}</strong><span className="text-xs text-slate-500 dark:text-slate-400">{dashboard.partnerCode}</span></div><button type="button" onClick={() => void signOut()} className="grid size-11 place-items-center rounded-xl border border-[#d3e3ed] bg-white text-slate-500 transition hover:-translate-y-0.5 hover:text-rose-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300" aria-label="Đăng xuất"><LogOut size={18} /></button></div></div></header>

    <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-7 lg:py-10">
      {error && <p role="alert" className="mb-5 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] p-4 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
      <motion.section {...reveal} className="relative overflow-hidden rounded-[2rem] border border-[#bad8e8] bg-[linear-gradient(135deg,#ffffff_0%,#eef8fd_57%,#e7f5fc_100%)] p-6 shadow-[0_34px_80px_-48px_rgba(7,64,103,.5)] dark:border-white/10 dark:bg-[linear-gradient(135deg,#0d1d34_0%,#0a182b_57%,#10213c_100%)] sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-28 size-80 rounded-full border border-[#0b8bd8]/10 dark:border-[#67e8f9]/10" /><div className="absolute -right-4 -top-14 size-52 rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-[#0873b8] dark:text-cyan-300"><Sparkles size={15} /> Partner Control Room</p><h1 className="mt-4 text-3xl font-black tracking-[-.035em] sm:text-4xl">Chào {dashboard.displayName}.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">Dữ liệu bên dưới được tổng hợp từ referral, đơn hàng và sổ commission. Chu kỳ last-click 60 ngày; hoa hồng chỉ khả dụng sau 30 ngày đối soát.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${dashboard.partnerCode}`)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#075f9d] px-4 text-sm font-bold text-white shadow-[0_14px_26px_-16px_rgba(7,95,157,.9)]"><Copy size={16} /> Sao chép link giới thiệu</button><Link href="/pricing" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#c6dce8] bg-white/75 px-4 text-sm font-bold dark:border-white/10 dark:bg-white/[0.05]">Xem bảng giá <ArrowUpRight size={16} /></Link></div></div>
          <div className="flex items-center gap-5 rounded-[1.6rem] border border-white/70 bg-white/65 p-5 shadow-[0_22px_45px_-35px_rgba(7,64,103,.6)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
            <div className={`relative grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br p-[4px] ${design.ring}`}><label className="relative z-10 grid size-full cursor-pointer place-items-center overflow-hidden rounded-full bg-[#f7fbfe] text-2xl font-black text-[#075f9d] dark:bg-[#0a182b] dark:text-white" title="Tải ảnh lên"><input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) setAvatarUrl(URL.createObjectURL(file)); }} />{avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Browser blob previews cannot use Next's image optimization pipeline.
                  <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                ) : user.fullName.split(/\s+/).slice(-2).map((part) => part[0]).join("")}</label>{dashboard.tier === "Silver" && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-full border border-slate-300/90 shadow-[0_0_0_3px_rgba(203,213,225,.35),0_0_20px_rgba(148,163,184,.42)] dark:border-slate-200/65 dark:shadow-[0_0_0_3px_rgba(148,163,184,.13),0_0_22px_rgba(203,213,225,.2)]" />}{dashboard.tier === "Gold" && <span aria-hidden className="pointer-events-none absolute inset-0 animate-pulse rounded-full shadow-[0_0_24px_rgba(245,158,11,.5)]" />}</div>
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[.68rem] font-black uppercase tracking-[.14em] ${design.tint} ${design.text}`}>Hạng {design.label}</span><strong className="mt-2 block text-3xl tracking-tight">{dashboard.commissionRate}%</strong><span className="text-xs text-slate-500">hoa hồng hiện hành</span></div>
          </div>
        </div>
      </motion.section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Click đã ghi nhận", value: number.format(dashboard.clickCount), note: "Cookie last-click 60 ngày", icon: MousePointerClick, tone: "text-[#0873b8]" }, { label: "Đơn thành công", value: number.format(dashboard.conversionCount), note: `${dashboard.conversionRate}% chuyển đổi`, icon: Target, tone: "text-violet-600 dark:text-violet-300" }, { label: "Đang giữ 30 ngày", value: money.format(dashboard.pendingBalance), note: "Chống hoàn tiền / tranh chấp", icon: Clock3, tone: "text-amber-600 dark:text-amber-300" }, { label: "Số dư khả dụng", value: money.format(dashboard.availableBalance), note: dashboard.availableBalance >= 500000 ? "Đã đủ ngưỡng rút" : "Cần tối thiểu 500.000đ", icon: Banknote, tone: "text-emerald-600 dark:text-emerald-300" }].map((item, index) => <motion.article key={item.label} {...reveal} transition={{ ...reveal.transition, delay: index * .07 }} className="rounded-[1.35rem] border border-[#cfe1ec] bg-white/85 p-5 shadow-[0_22px_50px_-40px_rgba(7,64,103,.5)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.045]"><div className={`grid size-10 place-items-center rounded-xl bg-[#edf7fc] dark:bg-white/[0.06] ${item.tone}`}><item.icon size={19} /></div><span className="mt-5 block text-xs font-bold text-slate-500 dark:text-slate-400">{item.label}</span><strong className="mt-1 block text-[1.65rem] font-black tracking-[-.04em] tabular-nums">{item.value}</strong><span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{item.note}</span></motion.article>)}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.18fr_.82fr]">
        <article className="rounded-[1.5rem] border border-[#cfe1ec] bg-white/85 p-6 shadow-[0_25px_60px_-45px_rgba(7,64,103,.55)] dark:border-white/[0.08] dark:bg-white/[0.045]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#0873b8] dark:text-cyan-300">Conversion pulse</p><h2 className="mt-2 text-xl font-black">Đơn hoàn tất · 8 tuần gần nhất</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chỉ tính attribution truy vết được về đơn nguồn.</p></div><TrendingUp className="text-emerald-500" /></div>{hasTimelineData ? <div className="mt-8 flex h-40 items-end gap-2.5">{dashboard.weeklyPerformance.map((item) => <div key={item.weekStartUtc} className="group relative flex-1" title={`${weekLabel.format(new Date(item.weekStartUtc))}: ${item.completedOrders} đơn hoàn tất · ${money.format(item.commissionAmount)} hoa hồng`}><div className="min-h-0.5 rounded-t-lg bg-[linear-gradient(180deg,#22d3ee_0%,#0b8bd8_60%,#075f9d_100%)] shadow-[0_0_18px_rgba(34,211,238,.16)] transition group-hover:brightness-110" style={{ height: `${Math.max(2, item.completedOrders / timelineMaximum * 100)}%` }} /><span className="mt-2 block text-center text-[.62rem] text-slate-400">{weekLabel.format(new Date(item.weekStartUtc))}</span></div>)}</div> : <div className="mt-8 grid h-40 place-items-center rounded-2xl border border-dashed border-[#cfe1ec] px-5 text-center text-sm leading-6 text-slate-500 dark:border-white/[0.1] dark:text-slate-400">Chưa có attribution có mốc thời gian để lập biểu đồ. Số liệu tổng vẫn hiển thị riêng, không nội suy thành cột giả.</div>}</article>
        <article className="rounded-[1.5rem] border border-[#cfe1ec] bg-white/85 p-6 shadow-[0_25px_60px_-45px_rgba(7,64,103,.55)] dark:border-white/[0.08] dark:bg-white/[0.045]"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#0873b8] dark:text-cyan-300">Tier progress</p><h2 className="mt-2 text-xl font-black">Hành trình lên hạng</h2></div><Award className={design.text} /></div><div className="mt-8 h-3 overflow-hidden rounded-full bg-[#e4eff5] dark:bg-white/[0.08]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#075f9d,#22d3ee)] shadow-[0_0_18px_rgba(34,211,238,.35)]" style={{ width: `${progress}%` }} /></div><div className="mt-4 flex items-center justify-between text-sm"><strong>{design.label}</strong><span className="text-slate-500">{dashboard.nextTier ? `Còn ${dashboard.ordersUntilNextTier} đơn tới hạng ${dashboard.nextTier}` : "Đã đạt hạng cao nhất"}</span></div><div className="mt-7 rounded-2xl border border-[#d7e6ef] bg-[#f5fafd] p-4 text-xs leading-6 text-slate-600 dark:border-white/[0.07] dark:bg-white/[0.025] dark:text-slate-300"><ShieldCheck size={17} className="mb-2 text-emerald-500" />Hệ thống đánh giá tự động đầu mỗi tháng từ đơn hoàn tất của tháng trước. Người dùng không thể tự chọn hoặc sửa cấp bậc.</div></article>
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#cfe1ec] bg-white/90 shadow-[0_25px_60px_-45px_rgba(7,64,103,.55)] dark:border-white/[0.08] dark:bg-[#0a182b]/90"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dbe8f0] px-5 py-5 dark:border-white/[0.07]"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#0873b8] dark:text-cyan-300">Commission ledger</p><h2 className="mt-1 text-xl font-black">Đơn hàng được ghi nhận</h2></div><span className="text-xs text-slate-500">Tên khách hàng đã được che một phần</span></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-[#f4f9fc] text-[.66rem] uppercase tracking-[.12em] text-slate-500 dark:bg-white/[0.035]"><tr><th className="px-5 py-3">Đơn / khách</th><th className="px-5 py-3">Gói</th><th className="px-5 py-3">Doanh thu</th><th className="px-5 py-3">Hoa hồng</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-[#e3edf3] dark:divide-white/[0.06]">{orders?.items.map((item) => <tr key={item.id} className="transition hover:bg-[#f5fafe] dark:hover:bg-white/[0.025]"><td className="px-5 py-4"><strong>{item.maskedCustomerName}</strong><code className="mt-1 block text-[.68rem] text-slate-500">{item.trackingCode}</code></td><td className="px-5 py-4 font-semibold">{item.planName}</td><td className="px-5 py-4 tabular-nums">{money.format(item.revenue)}</td><td className="px-5 py-4"><strong className="tabular-nums text-emerald-700 dark:text-emerald-300">{money.format(item.commissionAmount)}</strong><span className="block text-[.68rem] text-slate-500">{item.commissionRate}% snapshot</span></td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[.68rem] font-black ${statusClass(item.commissionStatus)}`}>{statusLabel(item.commissionStatus)}</span>{item.commissionStatus === "Pending" && item.availableAtUtc && <span className="mt-1 block text-[.65rem] text-slate-500">Dự kiến {date.format(new Date(item.availableAtUtc))}</span>}</td></tr>)}</tbody></table></div>{orders && <div className="border-t border-[#dbe8f0] px-5 py-4 dark:border-white/[0.07]"><Pagination pageNumber={orders.pageNumber} totalPages={orders.totalPages} onPageChange={setOrderPage} /></div>}</section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[.72fr_1.28fr]"><article className="rounded-[1.5rem] border border-[#bfe0d2] bg-[linear-gradient(145deg,#f0fcf7,#ffffff)] p-6 dark:border-emerald-400/15 dark:bg-[linear-gradient(145deg,rgba(16,185,129,.08),rgba(255,255,255,.025))]"><Banknote className="text-emerald-600 dark:text-emerald-300" /><p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-emerald-700 dark:text-emerald-300">Available wallet</p><strong className="mt-2 block text-3xl font-black tracking-tight tabular-nums">{money.format(dashboard.availableBalance)}</strong><p className="mt-3 text-xs leading-6 text-slate-600 dark:text-slate-300">Mỗi lần rút sẽ khóa toàn bộ hoa hồng khả dụng vào một lệnh đối soát để ngăn chi tiêu hai lần.</p><Button className="mt-6 w-full" disabled={dashboard.availableBalance < 500000} onClick={() => setWithdrawOpen(true)}>Tạo yêu cầu rút tiền</Button></article><article className="overflow-hidden rounded-[1.5rem] border border-[#cfe1ec] bg-white/90 dark:border-white/[0.08] dark:bg-[#0a182b]/90"><div className="border-b border-[#dbe8f0] px-5 py-5 dark:border-white/[0.07]"><p className="text-xs font-black uppercase tracking-[.16em] text-[#0873b8] dark:text-cyan-300">Payout history</p><h2 className="mt-1 text-xl font-black">Lịch sử đối soát</h2></div><div className="divide-y divide-[#e3edf3] dark:divide-white/[0.06]">{payouts?.items.length ? payouts.items.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><strong>{item.requestCode}</strong><span className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[.65rem] font-black align-middle ${statusClass(item.status)}`}>{statusLabel(item.status)}</span><span className="mt-1 block text-xs text-slate-500">{item.bankName} · {item.maskedBankAccount} · {date.format(new Date(item.requestedAtUtc))}</span></div><strong className="text-lg tabular-nums">{money.format(item.amount)}</strong></div>) : <div className="p-8 text-center text-sm text-slate-500">Chưa có yêu cầu rút tiền.</div>}</div>{payouts && <div className="border-t border-[#dbe8f0] px-5 py-4 dark:border-white/[0.07]"><Pagination pageNumber={payouts.pageNumber} totalPages={payouts.totalPages} onPageChange={setPayoutPage} /></div>}</article></section>
    </div>

    <Modal open={withdrawOpen} title="Yêu cầu rút toàn bộ số dư" onClose={() => { if (!withdrawBusy) setWithdrawOpen(false); }}><form className="grid gap-4" onSubmit={requestWithdrawal}><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4"><span className="text-xs text-slate-500">Số tiền yêu cầu</span><strong className="mt-1 block text-2xl text-emerald-700 dark:text-emerald-300">{money.format(dashboard.availableBalance)}</strong></div><Input label="Ngân hàng" name="bank-name" required maxLength={100} value={bank.bankName} onChange={(event) => setBank({ ...bank, bankName: event.target.value })} /><Input label="Số tài khoản" name="bank-account" required minLength={6} maxLength={32} pattern="[A-Za-z0-9]{6,32}" value={bank.bankAccountNumber} onChange={(event) => setBank({ ...bank, bankAccountNumber: event.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })} /><Input label="Tên chủ tài khoản" name="bank-owner" required maxLength={150} value={bank.bankAccountName} onChange={(event) => setBank({ ...bank, bankAccountName: event.target.value.toUpperCase() })} />{withdrawError && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{withdrawError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={withdrawBusy} onClick={() => setWithdrawOpen(false)}>Hủy</Button><Button type="submit" isLoading={withdrawBusy}>Gửi đối soát</Button></div></form></Modal>

    <Modal open={user.mustChangePassword} title="Đổi mật khẩu trước khi tiếp tục" onClose={() => undefined}><form className="grid gap-4" onSubmit={forceChangePassword}><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Tài khoản vừa được cấp mật khẩu tạm thời. Hãy đặt mật khẩu riêng tối thiểu 12 ký tự; các phiên cũ sẽ bị thu hồi sau khi đổi.</p><PasswordInput label="Mật khẩu tạm thời" name="current-password" required minLength={5} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /><PasswordInput label="Mật khẩu mới" name="new-password" required minLength={12} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /><PasswordInput label="Nhập lại mật khẩu mới" name="confirm-password" required minLength={12} value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} />{passwordError && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] p-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{passwordError}</p>}<Button type="submit" isLoading={passwordBusy}>Đổi mật khẩu và đăng nhập lại</Button></form></Modal>
  </main>;
}
