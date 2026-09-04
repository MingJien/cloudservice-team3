"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Star } from "lucide-react";
import { submitTestimonial, type TestimonialSubmission } from "@/features/content/api";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export function OrderTestimonialForm({ trackingCode }: { trackingCode: string }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [consentToPublish, setConsentToPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TestimonialSubmission | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setResult(await submitTestimonial({ trackingCode, content: content.trim(), rating, consentToPublish }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi đánh giá lúc này.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <section className="mt-8 overflow-hidden rounded-[1.35rem] border border-emerald-300/70 bg-[linear-gradient(135deg,rgba(236,253,245,.94),rgba(239,250,255,.92))] p-6 shadow-[0_22px_50px_-36px_rgba(5,150,105,.65)] dark:border-emerald-300/20 dark:bg-[linear-gradient(135deg,rgba(6,78,59,.2),rgba(8,47,73,.22))]" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-[0_10px_24px_-12px_rgba(16,185,129,.9)]"><CheckCircle2 size={20} /></span>
          <div>
            <h2 className="text-lg font-bold text-emerald-950 dark:text-emerald-100">Đã ghi nhận phản hồi</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-900/75 dark:text-emerald-100/75">{result.message}</p>
            {result.isFeaturedCustomer && <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-100/80 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200"><Sparkles size={14} /> Đơn này đủ điều kiện nhận nhãn khách hàng gói nổi bật sau khi nội dung được duyệt.</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-[1.35rem] border border-[#cde4f2] bg-[#f5fbff] p-5 dark:border-cyan-300/15 dark:bg-cyan-300/[0.045] sm:p-6" aria-labelledby="testimonial-heading">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-river-200 bg-white text-river-700 dark:border-cyan-300/15 dark:bg-white/[0.06] dark:text-cyan-300"><ShieldCheck size={19} /></span>
        <div>
          <h2 id="testimonial-heading" className="text-lg font-bold tracking-tight text-ink-950 dark:text-white">Chia sẻ trải nghiệm sau khi hoàn tất</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Mã đơn hợp lệ đã được backend xác minh. Phản hồi chỉ xuất hiện công khai sau khi quản trị viên kiểm duyệt.</p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        {error && <ErrorState description={error} />}
        <fieldset>
          <legend className="text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]">Mức độ hài lòng</legend>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Chọn điểm đánh giá">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} trên 5 sao`} onClick={() => setRating(value)} className={`grid h-11 w-11 place-items-center rounded-xl border transition-all ${value <= rating ? "border-amber-300 bg-amber-50 text-amber-500 shadow-[0_8px_20px_-15px_rgba(245,158,11,.9)] dark:border-amber-300/25 dark:bg-amber-300/10" : "border-line-200 bg-white text-slate-300 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/20"}`}>
                <Star size={18} className={value <= rating ? "fill-current" : undefined} />
              </button>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-2 text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]">
          Nội dung đánh giá
          <textarea required minLength={10} maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Điều gì trong quy trình tư vấn hoặc triển khai khiến bạn hài lòng?" className="min-h-32 rounded-xl border border-[#ccdeeb] bg-white px-3 py-3 text-base font-medium text-[#07101f] outline-none transition focus:border-[#0b8bd8] focus:ring-4 focus:ring-[#0b8bd8]/15 dark:border-white/10 dark:bg-[#071426]/78 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/15" />
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{content.length}/1000 ký tự · Không nhập email, số điện thoại hoặc dữ liệu nhạy cảm.</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d7e7f0] bg-white/70 p-3 text-xs leading-5 text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-300"><input type="checkbox" required checked={consentToPublish} onChange={(event) => setConsentToPublish(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0873b8]" /><span>Tôi đồng ý để MekongNode kiểm duyệt và công bố nội dung phản hồi cùng tên/công ty gắn với đơn. Tôi xác nhận nội dung không chứa dữ liệu nhạy cảm.</span></label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Mỗi đơn hoàn tất chỉ gửi được một phản hồi.</p>
          <Button type="submit" isLoading={loading} disabled={content.trim().length < 10 || !consentToPublish}>Gửi đánh giá để duyệt</Button>
        </div>
      </form>
    </section>
  );
}
