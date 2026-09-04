"use client";

import { useEffect, useMemo, useState } from "react";
import { getTestimonials, type Testimonial } from "@/features/content/api";

function formatRating(rating: number) {
  return `${rating}/5 sao`;
}

export function OrderReviewFeed({
  initialCategoryFilter = null,
  initialServicePlanFilter = null,
}: {
  initialCategoryFilter?: string | null;
  initialServicePlanFilter?: string | null;
}) {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const scopeKey = `${initialCategoryFilter ?? ""}:${initialServicePlanFilter ?? ""}`;
  const [searchState, setSearchState] = useState({ scopeKey, value: "" });
  const [categoryState, setCategoryState] = useState<{ scopeKey: string; value: string | null }>({ scopeKey, value: null });
  const search = searchState.scopeKey === scopeKey ? searchState.value : "";
  const category = categoryState.scopeKey === scopeKey ? categoryState.value : null;
  const setSearch = (value: string) => setSearchState({ scopeKey, value });
  const setCategory = (value: string | null) => setCategoryState({ scopeKey, value });

  useEffect(() => {
    let cancelled = false;

    getTestimonials({ verifiedOnly: true, pageSize: 100 })
      .then((result) => {
        if (!cancelled) setReviews(result.items);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => Array.from(new Set(
    reviews.map((review) => review.serviceCategoryName).filter((value): value is string => Boolean(value)),
  )), [reviews]);

  const visibleReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("vi-VN");
    return reviews.filter((review) => {
      const scopeMatches =
        (!initialCategoryFilter || review.serviceCategoryName === initialCategoryFilter) &&
        (!initialServicePlanFilter || review.servicePlanName === initialServicePlanFilter);
      if (!scopeMatches) return false;
      const categoryMatches = !category || review.serviceCategoryName === category;
      if (!categoryMatches) return false;
      if (!normalizedSearch) return true;
      return [review.customerName, review.content, review.servicePlanName, review.serviceCategoryName, review.orderReference]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedSearch));
    });
  }, [category, initialCategoryFilter, initialServicePlanFilter, reviews, search]);

  if (isLoading) {
    return <div className="space-y-5 animate-pulse" aria-label="Đang tải đánh giá đơn hàng">
      {[1, 2].map((item) => <div key={item} className="h-40 rounded-3xl bg-white/60 dark:bg-slate-800/60" />)}
    </div>;
  }

  if (hasError) {
    return <div className="rounded-3xl border border-dashed border-[#bce0f8] bg-white/55 px-6 py-12 text-center text-[#5a7b9c] dark:border-white/10 dark:bg-[#071426]/50 dark:text-[#bcccdc]">
      Không thể tải đánh giá lúc này. Vui lòng thử lại sau.
    </div>;
  }

  if (reviews.length === 0) {
    return <div className="rounded-3xl border border-dashed border-[#bce0f8] bg-white/55 px-6 py-12 text-center dark:border-white/10 dark:bg-[#071426]/50">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf8ff] text-[#0b8bd8] dark:bg-[#0b8bd8]/15 dark:text-[#67e8f9]">
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 2.4 4.86L19.8 8.65l-3.9 3.8.92 5.37L12 15.3l-4.82 2.52.92-5.37-3.9-3.8 5.4-.79L12 3Z" /></svg>
      </div>
      <p className="font-bold text-[#17324d] dark:text-white">Chưa có đánh giá đơn đã được duyệt.</p>
      <p className="mt-2 text-sm text-[#6b8298] dark:text-[#8ba8c4]">Khách hàng có thể gửi phản hồi sau khi đơn hàng chuyển sang Hoàn tất.</p>
    </div>;
  }

  return <div className="space-y-5">
    <p className="rounded-2xl border border-[#cfeafc] bg-[#edf8ff]/70 px-4 py-3 text-sm leading-relaxed text-[#366284] dark:border-[#0b8bd8]/20 dark:bg-[#0b8bd8]/10 dark:text-[#b9e9ff]">
      Chỉ hiển thị phản hồi từ đơn hàng đã hoàn tất và được quản trị viên duyệt trước khi công khai.{initialServicePlanFilter ? ` Đang xem gói ${initialServicePlanFilter}.` : initialCategoryFilter ? ` Đang xem danh mục ${initialCategoryFilter}.` : ""}
    </p>
    <div className="rounded-2xl border border-[#dcecf7] bg-white/75 p-3 dark:border-white/[0.07] dark:bg-white/[0.035]">
      <label className="sr-only" htmlFor="order-review-search">Tìm đánh giá theo gói hoặc nội dung</label>
      <div className="relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7a96ae]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input id="order-review-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo gói, danh mục hoặc nội dung..." className="h-11 w-full rounded-xl border border-[#d6ebfa] bg-white py-2 pl-10 pr-3 text-sm text-[#17324d] outline-none transition placeholder:text-[#8ba8c4] focus:border-[#0b8bd8] focus:ring-4 focus:ring-[#0b8bd8]/10 dark:border-white/[0.08] dark:bg-[#071426] dark:text-white" />
      </div>
      {!initialCategoryFilter && !initialServicePlanFilter && categories.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5" aria-label="Lọc đánh giá theo danh mục">
        <button type="button" onClick={() => setCategory(null)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition ${category === null ? "border-[#0b8bd8] bg-[#0b8bd8] text-white" : "border-[#d6ebfa] bg-white text-[#54738f] hover:border-[#0b8bd8] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#b9d0e4]"}`}>Tất cả</button>
        {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition ${category === item ? "border-[#0b8bd8] bg-[#0b8bd8] text-white" : "border-[#d6ebfa] bg-white text-[#54738f] hover:border-[#0b8bd8] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-[#b9d0e4]"}`}>{item}</button>)}
      </div>}
    </div>
    {visibleReviews.length === 0 && <div className="rounded-3xl border border-dashed border-[#bce0f8] bg-white/55 px-6 py-10 text-center text-sm text-[#5a7b9c] dark:border-white/10 dark:bg-[#071426]/50 dark:text-[#bcccdc]">Chưa có đánh giá đã duyệt cho {initialServicePlanFilter ?? initialCategoryFilter ?? "bộ lọc hiện tại"}.</div>}
    {visibleReviews.map((review) => (
      <article key={review.id} className="rounded-3xl border border-[#e6f2fb] bg-white p-6 shadow-lg shadow-[#0b8bd8]/5 transition-all hover:-translate-y-0.5 hover:border-[#bce0f8] hover:shadow-xl dark:border-white/[0.05] dark:bg-[#0a192f] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b8bd8] to-[#075985] text-lg font-extrabold text-white shadow-lg shadow-[#0b8bd8]/20">
            {review.customerName.charAt(0).toLocaleUpperCase("vi-VN")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#17324d] dark:text-white">{review.customerName}</h3>
                {review.companyName && <p className="mt-0.5 text-sm text-[#6b8298] dark:text-[#8ba8c4]">{review.companyName}</p>}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>
                Đơn đã xác minh
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1" aria-label={formatRating(review.rating)}>
              {Array.from({ length: 5 }, (_, index) => <svg key={index} width="17" height="17" viewBox="0 0 24 24" fill={index < review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className={index < review.rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"} aria-hidden="true"><path d="m12 3 2.4 4.86 5.4.79-3.9 3.8.92 5.37L12 15.3l-4.82 2.52.92-5.37-3.9-3.8 5.4-.79L12 3Z" /></svg>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-lg bg-[#edf8ff] px-2.5 py-1 text-xs font-bold text-[#0873b8] dark:bg-[#0b8bd8]/10 dark:text-[#67e8f9]">{review.orderReference ?? "Đơn đã hoàn tất"}</span>
              {review.serviceCategoryName && <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">{review.serviceCategoryName}</span>}
              {review.servicePlanName && <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/[0.08] dark:text-slate-200">{review.servicePlanName}</span>}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-[#365b7b] dark:text-[#d5e1ed]">{review.content}</p>
          </div>
        </div>
      </article>
    ))}
  </div>;
}
