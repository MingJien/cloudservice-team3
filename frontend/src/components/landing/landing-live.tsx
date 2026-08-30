"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCategories, getPlans, getPublicPromotions } from "@/features/catalog/api";
import type { Category, Plan, Promotion } from "@/features/catalog/types";
import { getArticles, getTestimonials } from "@/features/content/api";
import type { Article, Testimonial } from "@/features/content/api";
import { Container } from "@/components/layout/container";
import { HeroSection } from "./hero-section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ArticleVisual, estimateArticleReadingTime, formatArticleDate } from "@/components/content/article-visual";
import { ArrowRight, CalendarDays, Check, Clock3, Database, FileCheck2, Flame, ShieldCheck, Sparkles, Star } from "lucide-react";
import { CategoryIcon } from "@/components/brand/category-icon";
import type { BillingCycle } from "@/features/pricing/types";

const money = (value: number, currency = "VND") =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
/* COUNTDOWN TIMER */

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();
    if (isNaN(target)) return;

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="countdown-grid grid grid-cols-4 gap-2 sm:gap-3" aria-label="Thời gian ưu đãi còn lại">
      <div className="countdown-box">
        <span className="countdown-val">{String(timeLeft.days).padStart(2, "0")}</span>
        <span className="countdown-label">Ngày</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-val">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="countdown-label">Giờ</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-val">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="countdown-label">Phút</span>
      </div>
      <div className="countdown-box">
        <span className="countdown-val">{String(timeLeft.seconds).padStart(2, "0")}</span>
        <span className="countdown-label">Giây</span>
      </div>
    </div>
  );
}

/* PLAN CARDS SECTION (with category tabs) */

const cycleSuffix: Record<BillingCycle, string> = {
  Monthly: "/tháng",
  Quarterly: "/quý",
  Yearly: "/năm",
};

const specificationLabels: Record<string, string> = {
  IPv4: "IPv4 riêng",
  Backup: "Sao lưu",
  Uptime: "Mục tiêu uptime",
  Websites: "Website",
  EmailAccounts: "Tài khoản email",
  SSL: "SSL",
  Tlds: "Đuôi tên miền",
  Dnssec: "DNSSEC",
  Privacy: "Ẩn thông tin đăng ký",
  Mailboxes: "Hộp thư",
  AntiSpam: "Chống spam",
  Support: "Hỗ trợ",
  Validation: "Xác thực",
  Warranty: "Bảo hành",
  Renewal: "Gia hạn",
  Protection: "Bảo vệ",
  Traffic: "Lưu lượng",
  Policy: "Chính sách",
};

function planHighlights(plan: Plan) {
  const highlights: string[] = [];
  if (plan.cpuCores || plan.ramGb) highlights.push(`${plan.cpuCores ?? "-"} vCPU · ${plan.ramGb ?? "-"}GB RAM`);
  if (plan.storageGb) highlights.push(`${plan.storageGb}GB ${plan.storageType ?? "lưu trữ"}`);
  if (plan.bandwidthGb) highlights.push(`${plan.bandwidthGb.toLocaleString("vi-VN")}GB băng thông`);

  try {
    const specifications = JSON.parse(plan.specificationsJson || "{}") as Record<string, unknown>;
    for (const [key, value] of Object.entries(specifications)) {
      if (["imageUrl", "featuredLabel"].includes(key) || highlights.length >= 5) continue;
      const label = specificationLabels[key] ?? key;
      const displayValue = typeof value === "boolean" ? (value ? "Có" : "Không") : String(value);
      highlights.push(`${label}: ${displayValue}`);
    }
  } catch {
    // Invalid legacy JSON is ignored; the typed plan fields remain available.
  }

  return highlights.slice(0, 5);
}

function getCategoryStyle(catName: string) {
  const name = catName.toLowerCase();
  if (name.includes('vps')) return { bg: 'bg-river-600/10', text: 'text-river-700 dark:text-river-400' };
  if (name.includes('hosting')) return { bg: 'bg-accent-indigo/10', text: 'text-accent-indigo dark:text-indigo-400' };
  if (name.includes('domain')) return { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald dark:text-emerald-400' };
  if (name.includes('email')) return { bg: 'bg-accent-cyan/10', text: 'text-accent-cyan dark:text-cyan-400' };
  if (name.includes('ssl')) return { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' };
  return { bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' };
}

function PlanCardsSection({ categories, regularPlans }: { categories: Category[]; regularPlans: Plan[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredPlanId, setHoveredPlanId] = useState<number | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"Monthly" | "Yearly">("Monthly");

  // A billing tab is a purchase intent, not just a display preference.  Do not
  // tease a yearly-only plan in the monthly catalogue (or the reverse): every
  // card that remains must be orderable for the cycle the visitor selected.
  const sellablePlansForCycle = regularPlans.filter(
    (plan) => plan.isActive && plan.prices.some((price) => price.billingCycle === selectedCycle),
  );
  const filteredPlans = selectedCategory
    ? sellablePlansForCycle.filter((plan) => String(plan.categoryId) === selectedCategory)
    : sellablePlansForCycle;

  return (
    <section className="pricing-catalog-section relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ice-50 via-paper-50 to-white dark:from-ink-950 dark:via-ink-900 dark:to-ink-950" />

      <Container className="relative">
        <ScrollReveal variant="fadeUp">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Bảng giá</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-950 md:text-[3.25rem] dark:text-white">
              Minh bạch, <span className="gradient-text-dark dark:gradient-text">không phí ẩn</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
              Chọn đúng nhóm dịch vụ để xem cấu hình và mức giá hiệu lực được đọc trực tiếp từ API.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-line-200 bg-white/60 p-1 shadow-[0_2px_12px_-4px_rgba(8,72,114,.15)] backdrop-blur-md dark:border-white/10 dark:bg-ink-900/50">
            <button
              type="button"
              onClick={() => setSelectedCycle("Monthly")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${selectedCycle === "Monthly" ? "bg-river-600 text-white shadow-md shadow-river-600/30" : "text-slate-600 hover:text-river-700 dark:text-slate-400 dark:hover:text-cyan-300"}`}
            >
              Thanh toán Tháng
            </button>
            <button
              type="button"
              onClick={() => setSelectedCycle("Yearly")}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${selectedCycle === "Yearly" ? "bg-river-600 text-white shadow-md shadow-river-600/30" : "text-slate-600 hover:text-river-700 dark:text-slate-400 dark:hover:text-cyan-300"}`}
            >
              Thanh toán Năm
            </button>
          </div>
        </div>

        <div className="scrollbar-hide -mx-4 mt-8 flex snap-x snap-mandatory items-center justify-start gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" aria-label="Lọc bảng giá theo danh mục">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            aria-pressed={selectedCategory === null}
            className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              selectedCategory === null
                ? "border-river-600 bg-river-600 text-white shadow-[0_10px_24px_-15px_rgba(2,132,199,.9)]"
                : "border-[#d2e3ee] bg-white/85 text-[#405a72] shadow-[0_8px_20px_-18px_rgba(7,64,103,.6)] hover:border-[#a9cfe5] hover:bg-[#edf8ff] hover:text-river-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white"
            }`}
          >
            Tất cả ({sellablePlansForCycle.length})
          </button>
          {categories.map((cat) => {
            const count = sellablePlansForCycle.filter((plan) => plan.categoryId === cat.id).length;
            if (count === 0) return null;
            const categoryId = String(cat.id);
            const isSelected = selectedCategory === categoryId;
            const catStyle = getCategoryStyle(cat.name);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? null : categoryId)}
                aria-pressed={isSelected}
                className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? "border-river-600 bg-river-600 text-white shadow-[0_10px_24px_-15px_rgba(2,132,199,.9)]"
                    : `border-[#d2e3ee] bg-white/85 shadow-[0_8px_20px_-18px_rgba(7,64,103,.6)] hover:border-[#a9cfe5] hover:bg-[#edf8ff] hover:text-river-800 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] ${catStyle.text}`
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <CategoryIcon iconKey={cat.icon} slug={cat.slug} size={18} />
                  {cat.name}
                  <span className="ml-0.5 text-xs opacity-60">({count})</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`mt-12 pt-6 lg:pt-8 grid items-stretch gap-6 ${
            filteredPlans.length === 1
              ? "mx-auto max-w-sm"
              : filteredPlans.length === 2
                ? "mx-auto max-w-3xl md:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filteredPlans.map((plan, index) => {
            const price = plan.prices.find((item) => item.billingCycle === selectedCycle)!;
            const selectedCycleLabel = selectedCycle === "Yearly" ? "năm" : "tháng";
            const isDefaultPopular = filteredPlans.length >= 3 && index === 1;
            const isHovered = hoveredPlanId === plan.id;
            const isActiveCard = hoveredPlanId !== null ? isHovered : isDefaultPopular;
            const highlights = planHighlights(plan);

            return (
              <ScrollReveal key={plan.id} variant="fadeUp" delay={index * 90}>
                <article
                  onMouseEnter={() => setHoveredPlanId(plan.id)}
                  onMouseLeave={() => setHoveredPlanId(null)}
                  className={`pricing-plan-card spotlight-card relative flex h-full min-h-[29rem] flex-col rounded-[1.75rem] border p-7 md:p-8 transition-all duration-300 ${isActiveCard ? "pricing-plan-card-popular border-river-500 shadow-[0_18px_40px_-15px_rgba(8,139,216,.2)] lg:-translate-y-5 dark:border-cyan-500/50 dark:shadow-[0_18px_40px_-15px_rgba(34,211,238,.1)]" : "border-line-200 bg-white/70 hover:border-river-300 dark:border-white/10 dark:bg-ink-900/40"}`}
                >
                  {isDefaultPopular && <span className="absolute -top-3 left-7 rounded-full bg-river-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">Phổ biến nhất</span>}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-cyan-600 dark:text-cyan-300">{plan.categoryName}</p>
                      <h3 className="mt-3 text-xl font-bold text-ink-950 dark:text-white">{plan.name}</h3>
                    </div>
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" title={`Đang bán theo ${selectedCycleLabel}`} />
                  </div>

                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.shortDescription ?? "Cấu hình được quản lý trực tiếp từ service catalog."}</p>

                  <div className="mt-6 flex flex-wrap items-end gap-2">
                    <strong className="text-[clamp(2.1rem,4vw,3rem)] leading-none tracking-[-0.06em] text-ink-950 dark:text-white">{money(price.effectivePrice, price.currency)}</strong>
                    <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{cycleSuffix[price.billingCycle]}</span>
                  </div>
                  {price.salePrice != null && <p className="mt-2 text-sm text-slate-500 line-through">Giá gốc {money(price.originalPrice, price.currency)}</p>}

                  <ul className="mt-7 grid flex-1 content-start gap-3.5 text-sm text-slate-700 dark:text-slate-200">
                    {(highlights.length > 0 ? highlights : ["Tư vấn cấu hình theo nhu cầu", "Báo giá xác nhận từ API"]).map((highlight) => <li key={highlight} className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-cyan-500" size={17} strokeWidth={2.4} /><span>{highlight}</span></li>)}
                  </ul>

                  <Link href={`/order?planId=${plan.id}`} className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-center text-sm font-bold transition-all duration-300 ${isActiveCard ? "border-river-600 bg-river-600 text-white shadow-[0_16px_30px_-18px_rgba(2,132,199,.9)] hover:bg-river-500" : "border-[#cbdbe7] bg-transparent text-ink-950 hover:-translate-y-0.5 hover:border-river-500 hover:text-river-700 dark:border-white/20 dark:text-white dark:hover:border-cyan-300 dark:hover:text-cyan-200"}`}>
                    Bắt đầu với {plan.name}
                  </Link>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        {filteredPlans.length === 0 && (
          <div className="mt-10 rounded-2xl border border-line-200 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-ink-900/50">
            <p className="text-slate-500 dark:text-slate-400">Chưa có gói đang mở bán theo chu kỳ này trong danh mục đã chọn.</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link className="pricing-inline-link inline-flex items-center gap-2 text-sm font-semibold text-river-700 dark:text-accent-cyan" href="/pricing">Tính giá theo chu kỳ đang bán <span aria-hidden="true">→</span></Link>
        </div>
      </Container>
    </section>
  );
}

/* LANDING PAGE - PREMIUM REDESIGN */

export function LandingLive() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getPlans("pageNumber=1&pageSize=100"),
      getCategories(),
      getArticles("pageNumber=1&pageSize=3"),
      getTestimonials(),
      getPublicPromotions(),
    ])
      .then(([planPage, categoryPage, articlePage, testimonialPage, promotionItems]) => {
        if (!active) return;
        setPlans(planPage.items);
        setCategories(categoryPage.items);
        setArticles(articlePage.items);
        setTestimonials(testimonialPage.items.slice(0, 3));
        setPromotions(promotionItems);
      })
      .catch((caught: unknown) =>
        active && setError(caught instanceof Error ? caught.message : "Không thể tải dữ liệu trang chủ."),
      );
    return () => {
      active = false;
    };
  }, []);

  // Process plans logic
  const featuredPlan = plans.find((p) => p.isFeatured);
  const featuredPrice = featuredPlan?.prices[0];
  // The public promotions API already returns only currently usable promotions.
  const activeFlashPromotion = featuredPlan
    ? promotions
      .filter((promotion) =>
        promotion.isActive &&
        promotion.discountType === "Percentage" &&
        (promotion.servicePlanIds.length === 0 || promotion.servicePlanIds.includes(featuredPlan.id)),
      )
      .sort((left, right) => {
        const leftIsPlanSpecific = left.servicePlanIds.includes(featuredPlan.id) ? 1 : 0;
        const rightIsPlanSpecific = right.servicePlanIds.includes(featuredPlan.id) ? 1 : 0;
        if (leftIsPlanSpecific !== rightIsPlanSpecific) return rightIsPlanSpecific - leftIsPlanSpecific;
        if (left.discountValue !== right.discountValue) return right.discountValue - left.discountValue;
        return new Date(left.endAt).getTime() - new Date(right.endAt).getTime();
      })[0]
    : undefined;
  const directDiscountPercent = featuredPrice && featuredPrice.salePrice != null && featuredPrice.originalPrice > 0
    ? Math.round(((featuredPrice.originalPrice - featuredPrice.salePrice) / featuredPrice.originalPrice) * 100)
    : 0;
  const flashPercent = activeFlashPromotion ? Math.round(activeFlashPromotion.discountValue) : directDiscountPercent;
  const flashEndsAt = activeFlashPromotion?.endAt ?? featuredPrice?.effectiveTo ?? null;
  const featuredHighlights = featuredPlan ? planHighlights(featuredPlan).slice(0, 4) : [];
  const featuredOfferDescription = featuredPlan?.description?.trim()
    || featuredPlan?.shortDescription?.trim()
    || "Cấu hình cloud được đọc từ API để bạn so sánh tài nguyên và mức giá đang hiệu lực trước khi gửi yêu cầu.";
  // A featured plan remains a sellable catalog plan. Keeping it here prevents
  // a category from disappearing when that is its only active package.
  const regularPlans = [...plans].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1;
  });

  return (
    <main className="-mt-[7.25rem]">
      {/* SECTION 1: HERO */}
      <HeroSection />

      {/* Error banner */}
      {error && (
        <Container className="pt-8">
          <div className="rounded-2xl border border-danger-600/40 bg-danger-600/5 p-5 text-sm text-danger-600">
            {error}
          </div>
        </Container>
      )}

      {/* SECTION 1.5: TIME-BOXED FEATURED OFFER */}
      {featuredPlan && (
        <section className="featured-section-bg relative py-10 text-[#07101f] transition-colors duration-300 md:py-12 dark:text-white">
          <Container>
            <ScrollReveal variant="scaleIn">
              <div className="featured-offer-shell rounded-[2rem] p-px">
                <div className="featured-offer-panel grid overflow-hidden rounded-[calc(2rem-1px)] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                  <div className="featured-offer-media relative min-h-[19rem] overflow-hidden sm:min-h-[24rem] lg:min-h-[30rem]">
                    <Image
                      src="/images/mekongnode-featured-vps-sale.png"
                      alt={`Minh họa hạ tầng cho gói nổi bật ${featuredPlan.name}: máy chủ, cloud, NVMe và lớp bảo vệ`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 44vw"
                      className="featured-offer-image object-cover"
                    />
                    <div className="featured-offer-media-shade pointer-events-none absolute inset-0" />

                    <span className="featured-offer-badge absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider sm:left-6 sm:top-6">
                      <Flame size={13} fill="currentColor" aria-hidden="true" />
                      {flashPercent > 0 ? `Hot sale · Giảm ${flashPercent}%` : "Gói nổi bật"}
                    </span>

                    <div className="featured-offer-media-caption absolute inset-x-5 bottom-5 z-10 flex items-end justify-between gap-4 rounded-2xl px-4 py-3 sm:inset-x-6 sm:bottom-6">
                      <div>
                        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-200/80">Minh họa hạ tầng</p>
                        <p className="mt-1 text-sm font-bold text-white">Cloud · NVMe · Shield</p>
                      </div>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-300/10 text-cyan-200">
                        <ShieldCheck size={18} aria-hidden="true" />
                      </span>
                    </div>
                  </div>

                  <div className="featured-offer-copy flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
                    <span className="featured-offer-kicker inline-flex w-fit items-center rounded-full px-3.5 py-2 text-xs font-bold uppercase tracking-wider">
                      {featuredPlan.categoryName} · Gói nổi bật cho website và ứng dụng nhỏ
                    </span>

                    <h2 className="mt-5 text-3xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-4xl lg:text-[2.75rem]">
                      {featuredPlan.name}
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d7087] sm:text-base dark:text-white/65">
                      {featuredOfferDescription}
                    </p>

                    {activeFlashPromotion && (
                      <p className="featured-offer-promo-note mt-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-xs font-semibold leading-5">
                        <Flame className="mt-0.5 shrink-0" size={15} fill="currentColor" aria-hidden="true" />
                        <span>
                          <strong>Mã {activeFlashPromotion.code}</strong>
                          {activeFlashPromotion.usageLimit != null ? ` · Giới hạn ${activeFlashPromotion.usageLimit.toLocaleString("vi-VN")} yêu cầu` : ""}, nhanh tay chốt ngay!
                        </span>
                      </p>
                    )}

                    {featuredHighlights.length > 0 && (
                      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2" aria-label={`Thông số chính của ${featuredPlan.name}`}>
                        {featuredHighlights.map((highlight) => (
                          <li key={highlight} className="featured-offer-feature flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-semibold">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-600 dark:text-emerald-300">
                              <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                            </span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-8 border-t border-[#d9e8f1] pt-6 text-center dark:border-white/[0.09]">
                      {featuredPrice ? (
                        <div className="flex flex-col items-center">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-river-700 dark:text-cyan-200/75">
                            {activeFlashPromotion ? "Giá gói trước mã khuyến mãi" : "Giá ưu đãi đang hiệu lực"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-end justify-center gap-x-2 gap-y-1">
                            <p className="featured-offer-price text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
                              {money(featuredPrice.effectivePrice, featuredPrice.currency)}
                            </p>
                            <span className="pb-1.5 text-sm font-semibold text-slate-500 dark:text-white/45">
                              {cycleSuffix[featuredPrice.billingCycle]}
                            </span>
                          </div>
                          {featuredPrice.salePrice != null && featuredPrice.originalPrice > featuredPrice.salePrice && (
                            <p className="mt-2 text-base font-semibold text-slate-600 dark:text-white/62">
                              Giá gốc <span className="decoration-2 line-through">{money(featuredPrice.originalPrice, featuredPrice.currency)}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-lg font-bold">Liên hệ để nhận báo giá đang hiệu lực</p>
                      )}

                      {flashEndsAt && <CountdownTimer endDate={flashEndsAt} />}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Link href={`/order?planId=${featuredPlan.id}${activeFlashPromotion ? `&promotionCode=${encodeURIComponent(activeFlashPromotion.code)}` : ""}`} className="featured-offer-cta inline-flex min-h-14 items-center justify-center rounded-2xl px-6 text-center text-sm font-bold text-white">
                        Chọn ngay gói {featuredPlan.name}
                      </Link>
                      <Link href={`/services/${featuredPlan.slug}`} className="featured-offer-secondary inline-flex min-h-14 items-center justify-center rounded-2xl px-5 text-sm font-bold">
                        Xem cấu hình
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </Container>
        </section>
      )}

      {/* SECTION 2: SERVICE CATALOG */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="grid-pattern-light pointer-events-none absolute inset-0 opacity-60" />
        <Container className="relative">
          <ScrollReveal variant="fadeUp">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-river-600">
                  Service catalog
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Mỗi nhóm dịch vụ giải quyết <span className="gradient-text-dark">một nhu cầu cụ thể</span>
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                  Danh mục được tách theo VPS, Hosting, tên miền, email và bảo mật để người dùng không phải đọc một bảng thông số lẫn lộn.
                </p>
              </div>
              <Link className="font-semibold text-river-700 hover:underline" href="/services">
                Xem tất cả →
              </Link>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <ScrollReveal key={category.id} variant="fadeUp" delay={index * 80}>
                <Link href={`/services?category=${category.slug}`} className="group block h-full">
                  <div className="card-hover-lift gradient-border-card spotlight-card h-full rounded-2xl border border-line-200 dark:border-white/10 bg-white dark:bg-ink-900 p-6 shadow-sm relative overflow-hidden">
                    {/* Subtle noise/mesh for premium feel */}
                    <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[radial-gradient(circle_at_top_right,_var(--color-river-600)_0%,_transparent_60%)]" />
                    
                    <div className="relative z-10 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ice-100 dark:bg-white/5 border border-line-100 dark:border-white/5">
                        <CategoryIcon iconKey={category.icon} slug={category.slug} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-river-600 dark:text-accent-cyan">
                        {category.slug}
                      </p>
                    </div>
                    <h3 className="relative z-10 mt-5 text-lg font-bold text-ink-950 dark:text-white transition-colors group-hover:text-river-700 dark:group-hover:text-accent-cyan">
                      {category.name}
                    </h3>
                    <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {category.description ?? "Backend chưa cung cấp mô tả; mở danh mục để xem các gói và thông số hiện có."}
                    </p>
                    <p className="relative z-10 mt-4 text-sm font-semibold text-river-600 dark:text-accent-cyan opacity-0 transition-opacity group-hover:opacity-100">
                      Khám phá →
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      <Container><hr className="section-divider" /></Container>

      {/* SECTION 3: PLAN CARDS */}
      <PlanCardsSection
        categories={categories}
        regularPlans={regularPlans}
      />

      {/* SECTION 4: RELIABILITY / PROCESS */}
      <section className="process-section relative overflow-hidden py-20 text-[#07101f] md:py-28 dark:text-white">
        <div className="process-grid pointer-events-none absolute inset-0" />
        <div className="process-orb pointer-events-none" />

        <Container className="relative z-10">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            {/* Left - Copy */}
            <ScrollReveal variant="fadeLeft">
              <div className="lg:sticky lg:top-32">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-river-700 dark:text-accent-cyan">
                  Luồng nghiệp vụ có thể kiểm chứng
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.035em] md:text-4xl">
                  Từ lúc nhập nhu cầu đến khi <span className="gradient-text-dark dark:gradient-text">tra cứu trạng thái</span> đều có dữ liệu đối chiếu.
                </h2>
                <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-white/60">
                  Nhóm ưu tiên những phần có thể chạy và kiểm tra: luật tư vấn giải thích được, giá tính tại API,
                  yêu cầu có mã tra cứu và thao tác quản trị được giới hạn theo vai trò.
                </p>
                <Link
                  className="mt-7 inline-flex items-center gap-2 font-semibold text-river-700 transition-colors hover:text-river-500 dark:text-accent-cyan dark:hover:text-white"
                  href="/about"
                >
                  Xem cách nhóm xây dựng hệ thống
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>

            {/* Right - Steps */}
            <div className="space-y-5">
              {[
                {
                  step: "01",
                  title: "Nhập nhu cầu",
                  desc: "Advisor dùng tập luật rõ ràng và trả kèm lý do đề xuất, để kết quả có thể đọc lại và kiểm thử.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                    </svg>
                  ),
                },
                {
                  step: "02",
                  title: "Tính tại API",
                  desc: "Giá, khuyến mãi và chu kỳ thanh toán được kiểm tra ở backend, không gắn cứng con số trên giao diện.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  ),
                },
                {
                  step: "03",
                  title: "Theo dõi trạng thái",
                  desc: "Mã tracking được sinh bằng CSPRNG; mỗi lần chuyển trạng thái đi theo luồng nghiệp vụ đã định nghĩa.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <ScrollReveal key={item.step} variant="fadeRight" delay={i * 120}>
                  <div className="process-card flex gap-5 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-river-600/10 bg-river-600/10 text-river-700 dark:border-white/5 dark:bg-river-600/15 dark:text-accent-cyan">
                      {item.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-river-600 dark:text-river-500">{item.step}</span>
                        <h3 className="text-lg font-bold">{item.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-white/55">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* SECTION 5: KNOWLEDGE BASE / BLOG */}
      <section className="relative py-20 md:py-28">
        <Container>
          <ScrollReveal variant="fadeUp">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-river-600">
                  Ghi chú triển khai
                </p>
                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Bài viết được quản trị từ <span className="gradient-text-dark">backend</span>
                </h2>
              </div>
              <Link className="font-semibold text-river-700 hover:underline" href="/blog">
                Xem blog →
              </Link>
            </div>
          </ScrollReveal>

          {articles[0] && (
            <ScrollReveal variant="fadeUp" delay={80}>
              <Link href={`/blog/${articles[0].slug}`} className="group mt-10 grid overflow-hidden rounded-[1.7rem] border border-[#cbe1ed] bg-white shadow-[0_30px_75px_-48px_rgba(7,64,103,.72)] transition-all duration-300 hover:-translate-y-1 hover:border-[#83c4e2] dark:border-white/10 dark:bg-[#0d1b32] dark:hover:border-cyan-300/30 lg:grid-cols-[1.1fr_.9fr]">
                <div className="relative min-h-72 overflow-hidden lg:min-h-[24rem]">
                  <ArticleVisual article={articles[0]} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061126]/55 to-transparent lg:hidden" />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#071426]/72 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-cyan-200 backdrop-blur-xl">
                    <Sparkles size={13} aria-hidden="true" /> Bài mới nổi bật
                  </span>
                </div>
                <article className="flex flex-col justify-center p-7 sm:p-9 lg:p-11">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] dark:text-cyan-300">{articles[0].categoryName}</p>
                  <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">{articles[0].title}</h3>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{articles[0].summary ?? articles[0].content.slice(0, 220)}</p>
                  <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{formatArticleDate(articles[0].publishedAt ?? articles[0].createdAt)}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 size={14} aria-hidden="true" />{estimateArticleReadingTime(articles[0])} phút đọc</span>
                    <span>{articles[0].authorName ?? "Nhóm MekongNode"}</span>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#0873b8] dark:text-cyan-300">Đọc bài phân tích <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
                </article>
              </Link>
            </ScrollReveal>
          )}

          {articles.length > 1 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {articles.slice(1).map((article, index) => (
                <ScrollReveal key={article.id} variant="fadeUp" delay={(index + 1) * 90}>
                  <Link href={`/blog/${article.slug}`} className="group flex min-h-full flex-col overflow-hidden rounded-[1.45rem] border border-[#d4e5ef] bg-white shadow-[0_20px_50px_-42px_rgba(7,64,103,.7)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8ec8e4] dark:border-white/[0.09] dark:bg-[#0d1b32] dark:hover:border-cyan-300/25">
                    <div className="relative h-52 overflow-hidden">
                      <ArticleVisual article={article} />
                      <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-[#071426]/72 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-cyan-200 backdrop-blur-xl">{article.categoryName}</span>
                    </div>
                    <article className="flex flex-1 flex-col p-6">
                      <h3 className="text-xl font-bold leading-snug tracking-[-0.025em]">{article.title}</h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.summary ?? article.content.slice(0, 145)}</p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatArticleDate(article.publishedAt ?? article.createdAt)}</span>
                        <span>{estimateArticleReadingTime(article)} phút đọc</span>
                      </div>
                    </article>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* SECTION 6: TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="testimonial-section relative overflow-hidden py-20 md:py-28">
          <div className="testimonial-grid pointer-events-none absolute inset-0" />
          <div className="testimonial-aura testimonial-aura-one pointer-events-none" />
          <div className="testimonial-aura testimonial-aura-two pointer-events-none" />

            <Container className="relative">
              <ScrollReveal variant="fadeUp">
                <div className="mx-auto max-w-3xl text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-river-600 dark:text-accent-cyan">
                    Phản hồi có kiểm duyệt
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ink-950 md:text-[2.75rem] dark:text-white">
                    Phản hồi hiển thị có <span className="gradient-text-dark dark:gradient-text">nguồn và trạng thái rõ ràng</span>
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                    Nội dung được đọc từ API. Phản hồi từ đơn hoàn tất có nhãn xác minh; bản ghi do quản trị nhập được tách nguồn để không đánh đồng với trải nghiệm mua hàng.
                  </p>
                </div>
              </ScrollReveal>

            <div className={`mx-auto mt-12 grid gap-6 ${testimonials.length === 1 ? "max-w-5xl lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]" : testimonials.length === 2 ? "max-w-4xl md:grid-cols-2" : "md:grid-cols-3"}`}>
              {testimonials.map((item, index) => (
                <ScrollReveal key={item.id} variant="scaleIn" delay={index * 100}>
                  <figure className="testimonial-proof-card group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white/10 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:bg-slate-900/50 sm:p-8">
                    <div className="testimonial-specular pointer-events-none absolute inset-x-0 top-0 h-px" />

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="testimonial-api-badge inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                          {item.isVerifiedOrder ? <ShieldCheck size={13} aria-hidden="true" /> : <Database size={13} aria-hidden="true" />}
                          {item.isVerifiedOrder ? "Đơn hoàn tất đã xác minh" : "Bản ghi quản trị"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-success-600 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                          Đang hiển thị
                        </span>
                      </div>

                      <div className="mt-6 flex items-center gap-1" aria-label={`Điểm dữ liệu ${item.rating} trên 5`}>
                        {Array.from({ length: 5 }, (_, starIndex) => (
                          <Star
                            key={starIndex}
                            size={16}
                            strokeWidth={1.8}
                            className={starIndex < item.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-white/20"}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.rating}/5 {item.isVerifiedOrder ? "· phản hồi đã duyệt" : "· bản ghi quản trị"}
                        </span>
                      </div>

                      <blockquote className="mt-5 text-[1.02rem] font-medium leading-8 text-ink-950 dark:text-slate-100">
                        &ldquo;{item.content}&rdquo;
                      </blockquote>

                      <figcaption className="mt-auto flex items-center gap-3 border-t border-line-100 pt-5 dark:border-white/[0.08]">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-river-700 via-river-500 to-accent-cyan text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(8,122,193,.85)] ${item.isFeaturedCustomer ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-white dark:ring-amber-300 dark:ring-offset-[#0d1b32]" : ""}`}>
                          {item.customerName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink-950 dark:text-white">{item.customerName}</p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {[item.position, item.companyName].filter(Boolean).join(" · ") || "Không gắn danh tính khách hàng thật"}
                          </p>
                          {item.isFeaturedCustomer && <p className="mt-1 inline-flex items-center gap-1 text-[0.67rem] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300"><Star size={11} className="fill-current" /> Khách hàng gói nổi bật</p>}
                        </div>
                      </figcaption>
                    </div>
                  </figure>
                </ScrollReveal>
              ))}

              {testimonials.length === 1 && (
                <ScrollReveal variant="fadeRight" delay={120}>
                  <aside className="testimonial-governance-card relative h-full overflow-hidden rounded-[1.5rem] p-7 sm:p-8" aria-label="Cách kiểm soát dữ liệu phản hồi">
                    <div className="relative z-10">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-river-700 dark:text-accent-cyan">
                        <ShieldCheck size={16} aria-hidden="true" />
                        Content governance
                      </span>
                      <h3 className="mt-4 text-2xl font-bold tracking-[-0.025em] text-ink-950 dark:text-white">
                        Một card đẹp vẫn phải giải thích được dữ liệu đến từ đâu.
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Giao diện không nhân bản nội dung để lấp chỗ trống. Khi API có thêm bản ghi đang hoạt động, lưới tự mở rộng thành hai hoặc ba cột.
                      </p>

                      <ul className="mt-7 grid gap-3">
                        {[
                          { icon: Database, label: "Nguồn công khai", value: "GET /api/testimonials" },
                          { icon: FileCheck2, label: "Điều kiện hiển thị", value: "Chỉ lấy bản ghi đang hoạt động" },
                          { icon: ShieldCheck, label: "Nguyên tắc nội dung", value: "Đơn hoàn tất, một phản hồi và luôn qua duyệt" },
                        ].map(({ icon: Icon, label, value }) => (
                          <li key={label} className="governance-row flex items-start gap-3 rounded-2xl p-3.5">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-river-600/10 text-river-700 dark:bg-cyan-300/10 dark:text-accent-cyan">
                              <Icon size={17} aria-hidden="true" />
                            </span>
                            <span>
                              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-slate-500 dark:text-slate-400">{label}</span>
                              <span className="mt-0.5 block text-sm font-semibold text-ink-950 dark:text-slate-100">{value}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </aside>
                </ScrollReveal>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* SECTION 7: FINAL CTA */}
      <section className="relative overflow-hidden bg-ink-950 py-24 text-white md:py-32">
        {/* Background effects */}
        <div
          className="mesh-orb pointer-events-none"
          style={{
            width: "50vw",
            height: "50vw",
            maxWidth: 600,
            maxHeight: 600,
            background: "radial-gradient(circle, rgba(30,102,165,0.35) 0%, transparent 70%)",
            top: "-15%",
            left: "15%",
            animation: "drift-2 20s infinite ease-in-out",
          }}
        />
        <div
          className="mesh-orb pointer-events-none"
          style={{
            width: "30vw",
            height: "30vw",
            maxWidth: 400,
            maxHeight: 400,
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            bottom: "-10%",
            right: "5%",
            animation: "drift-3 24s infinite ease-in-out",
          }}
        />
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-30" />

        <Container className="relative z-10 text-center">
          <ScrollReveal variant="blurIn">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-cyan">
               Thử luồng hoàn chỉnh
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
              Từ nhu cầu ban đầu đến <span className="gradient-text">một yêu cầu có thể tra cứu</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/60">
              Dùng advisor theo luật, kiểm tra bảng giá đang hiệu lực rồi gửi yêu cầu. Ba bước này đều gọi API thật của đồ án.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={200}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                className="glow-btn inline-flex min-h-12 items-center justify-center rounded-2xl bg-river-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-river-500"
                href="/advisor"
              >
                Mở công cụ chọn gói
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                href="/pricing"
              >
                Tính thử chi phí
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
