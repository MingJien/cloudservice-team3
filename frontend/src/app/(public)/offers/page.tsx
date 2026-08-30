"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Copy, Layers3, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { getPlans, getPublicPromotions } from "@/features/catalog/api";
import type { Plan, Promotion } from "@/features/catalog/types";

function money(value: number) { return new Intl.NumberFormat("vi-VN").format(value) + " đ"; }
function date(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export default function OffersPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getPublicPromotions(), getPlans("pageNumber=1&pageSize=100")])
      .then(([offers, planPage]) => { if (active) { setPromotions(offers); setPlans(planPage.items); setError(""); } })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải ưu đãi."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  async function copy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied((current) => current === code ? null : current), 1800);
  }

  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_12%_0%,rgba(34,199,217,.12),transparent_30%),linear-gradient(180deg,#f4faff_0%,#ffffff_38%)] py-14 text-[#07101f] dark:bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.1),transparent_28%),linear-gradient(180deg,#07101f_0%,#081426_42%,#07101f_100%)] dark:text-white md:py-20">
      <Container>
        {/* Hero Section - Glowing Glassmorphism & High Contrast */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[#040914] shadow-[0_24px_50px_-12px_rgba(4,9,20,0.5)] sr-hidden sr-fadeUp sr-visible">
          {/* Decorative artwork stays behind real HTML copy and the live status
              indicator; pricing/status never depends on pixels in the image. */}
          <div className="absolute inset-0" aria-hidden="true">
            <Image
              src="/images/offers-hero-banner.png"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,9,20,.82),rgba(4,9,20,.46),rgba(4,9,20,.82))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,9,20,.18),rgba(4,9,20,.72))]" />
          </div>
          {/* Abstract Backgrounds */}
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px] animate-[float-gentle_8s_ease-in-out_infinite]"></div>
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-[120px] animate-[float-gentle_10s_ease-in-out_infinite_reverse]"></div>
          
          <div className="relative z-10 flex min-h-[340px] flex-col items-center justify-center px-6 py-16 text-center">
             {/* Hot Sale Badge */}
             <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 backdrop-blur-md">
               <span className="relative flex h-2.5 w-2.5">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                 <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
               </span>
               <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Hot Sale</p>
             </div>
             
             {/* Masterpiece Typography */}
             <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-[#e2f2ff] to-[#67e8f9] sm:text-6xl md:text-[4.5rem]">
               Ưu đãi hạ tầng tháng 8
             </h1>
             <p className="mt-5 max-w-2xl text-xl font-medium text-slate-300 sm:text-2xl">
               Bứt phá doanh thu. Hosting & VPS giảm tới <span className="font-bold text-white">10%</span>
             </p>
          </div>
        </section>

        {/* Dimensional Overlap Terms Panel */}
        <section 
          className="relative z-20 mx-auto -mt-12 max-w-5xl rounded-[1.5rem] border border-white/40 bg-white/80 p-6 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/80 sm:p-8 sr-hidden sr-fadeUp sr-visible"
          style={{ animationDelay: '200ms' }}
        >
           <div className="grid gap-6 md:grid-cols-2 md:gap-12">
              <div>
                 <div className="flex items-center gap-3 text-cyan-600 dark:text-cyan-400">
                    <CalendarClock size={20} className="shrink-0" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Thời gian áp dụng</h3>
                 </div>
                 <p className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
                   Từ ngày <strong className="text-slate-900 dark:text-white">01/08/2026</strong> đến hết ngày <strong className="text-slate-900 dark:text-white">31/08/2026</strong>.
                 </p>
              </div>
              <div>
                 <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                    <Layers3 size={20} className="shrink-0" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Đối tượng áp dụng</h3>
                 </div>
                 <p className="mt-3 text-base text-slate-700 dark:text-slate-300">
                   Tất cả khách hàng đăng ký mới các gói dịch vụ hosting và VPS sau:
                 </p>
                 <ul className="mt-2 list-inside list-disc space-y-1 pl-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                   <li>VPS: <span className="font-semibold text-slate-900 dark:text-white">VPS SSD, VPS NVMe.</span></li>
                   <li>Hosting: <span className="font-semibold text-slate-900 dark:text-white">NVMe, Business, WordPress, MaxSpeed.</span></li>
                 </ul>
              </div>
           </div>
        </section>
        
        {/* Offers Header */}
        <div className="mt-16 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">1. Ưu đãi dịch vụ</h2>
          <div className="hidden items-center gap-3 text-xs font-semibold text-slate-500 md:flex">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-cyan-600 dark:text-cyan-400" /> Tự động áp dụng</span>
            <span className="flex items-center gap-1.5"><CalendarClock size={14} className="text-cyan-600 dark:text-cyan-400" /> Cập nhật theo giờ</span>
          </div>
        </div>

        {error && <div className="mt-8"><ErrorState title="Chưa tải được ưu đãi" description={error} /></div>}
        {!error && loading && <div className="mt-8 grid gap-6 lg:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-[1.5rem] bg-slate-100 dark:bg-white/5" />)}</div>}
        {!error && !loading && promotions.length === 0 && <Card className="mt-8 text-center py-16"><h2 className="text-2xl font-bold">Chưa có voucher đang hiệu lực</h2><p className="mt-3 text-base text-slate-500">Bảng giá vẫn hoạt động bình thường; ưu đãi mới sẽ xuất hiện tại đây khi quản trị viên kích hoạt.</p></Card>}

        {/* High-Converting Offer Cards */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2" aria-label="Danh sách ưu đãi">
          {promotions.map((promotion, index) => {
            const applicablePlans = promotion.servicePlanIds.map((id) => planMap.get(id)).filter((plan): plan is Plan => Boolean(plan));
            const primaryPlan = applicablePlans[0];
            return <article 
              key={promotion.id} 
              className="spotlight-card card-hover-glow sr-hidden sr-fadeUp sr-visible flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-7 transition-all duration-300 dark:border-white/10 dark:bg-ink-900/80"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              {/* Highlight Line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
              
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-extrabold tracking-widest text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                      {promotion.discountType === "Percentage" ? `GIẢM ${promotion.discountValue}%` : `GIẢM ${money(promotion.discountValue)}`}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight">{promotion.name}</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => void copy(promotion.code)} 
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm font-bold text-slate-700 transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10" 
                    aria-label={`Sao chép mã ${promotion.code}`}
                  >
                    {copied === promotion.code ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-cyan-600 dark:text-cyan-400" />}
                    {promotion.code}
                  </button>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {promotion.description || "Ưu đãi được kiểm tra tự động tại thời điểm lập báo giá và gửi đơn."}
                </p>
                
                {/* Meta details */}
                <dl className="mt-6 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-sm dark:border-white/5 dark:bg-white/[0.02] sm:grid-cols-2">
                  <div><dt className="text-[13px] font-semibold text-slate-500">Đơn tối thiểu</dt><dd className="mt-1 font-bold">{promotion.minOrderValue > 0 ? money(promotion.minOrderValue) : "Không yêu cầu"}</dd></div>
                  <div><dt className="text-[13px] font-semibold text-slate-500">Giảm tối đa</dt><dd className="mt-1 font-bold">{promotion.maxDiscountAmount ? money(promotion.maxDiscountAmount) : "Không giới hạn"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-[13px] font-semibold text-slate-500">Hiệu lực</dt><dd className="mt-1 font-semibold">{date(promotion.startAt)} → {date(promotion.endAt)}</dd></div>
                </dl>
                
                {/* Tags */}
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Gói áp dụng</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {applicablePlans.length ? applicablePlans.map((plan) => 
                      <span key={plan.id} className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        {plan.categoryName} · {plan.name}
                      </span>
                    ) : 
                      <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        Tất cả gói đang bán
                      </span>
                    }
                  </div>
                </div>
              </div>
              
              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link 
                  href={`/pricing?${new URLSearchParams({ ...(primaryPlan ? { planId: String(primaryPlan.id) } : {}), promotionCode: promotion.code })}`} 
                  className="glow-btn inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white transition-all hover:bg-cyan-500"
                >
                  Kiểm tra báo giá
                </Link>
                <Link 
                  href={`/order?${new URLSearchParams({ ...(primaryPlan ? { planId: String(primaryPlan.id) } : {}), promotionCode: promotion.code })}`} 
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 bg-transparent px-5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  Dùng mã đặt dịch vụ
                </Link>
              </div>
            </article>;
          })}
        </section>
      </Container>
    </main>
  );
}
