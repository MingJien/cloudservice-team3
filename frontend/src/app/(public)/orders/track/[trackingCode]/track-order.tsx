"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Clock3, X } from "lucide-react";
import { trackOrder, type OrderStatus, type OrderTracking } from "@/features/orders/api";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { OrderTestimonialForm } from "@/components/public/order-testimonial-form";

const labels: Record<OrderStatus, string> = {
  New: "Chờ tiếp nhận",
  Processing: "Đang xử lý",
  Done: "Hoàn tất",
  Rejected: "Đã từ chối",
};

function OrderTimeline({ order }: { order: OrderTracking }) {
  const terminal = order.status === "Rejected" ? "Rejected" : "Done";
  const steps: Array<{ key: OrderStatus; label: string; detail: string }> = [
    { key: "New", label: "Đã gửi yêu cầu", detail: "Backend đã cấp mã tra cứu và lưu snapshot gói/giá." },
    { key: "Processing", label: "Kiểm tra & xử lý", detail: "Admin xác minh nhu cầu, khả năng cung cấp và thông tin liên hệ." },
    { key: terminal, label: terminal === "Done" ? "Hoàn tất" : "Từ chối", detail: terminal === "Done" ? "Yêu cầu đã hoàn thành theo quy trình." : "Yêu cầu đã dừng; bộ phận phụ trách sẽ liên hệ khi cần làm rõ." },
  ];
  const currentIndex = order.status === "New" ? 0 : order.status === "Processing" ? 1 : 2;

  return <ol className="mt-8 grid gap-0" aria-label="Tiến trình đơn hàng">
    {steps.map((step, index) => {
      const reached = index <= currentIndex;
      const current = index === currentIndex;
      const rejected = step.key === "Rejected" && current;
      return <li key={`${step.key}-${index}`} className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-7 last:pb-0">
        {index < steps.length - 1 && <span className={`absolute left-[1.18rem] top-9 h-[calc(100%-1rem)] w-0.5 ${index < currentIndex ? "bg-river-500" : "bg-slate-200 dark:bg-white/10"}`} aria-hidden="true" />}
        <span className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 ${rejected ? "border-rose-500 bg-rose-500 text-white" : reached ? "border-river-600 bg-river-600 text-white" : "border-slate-200 bg-white text-slate-400 dark:border-white/10 dark:bg-slate-900"}`} aria-hidden="true">{rejected ? <X size={17} /> : reached && !current ? <Check size={17} /> : <Clock3 size={17} />}</span>
        <div className={`rounded-2xl border p-4 ${current ? rejected ? "border-rose-300 bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/5" : "border-river-300 bg-river-50 dark:border-cyan-400/20 dark:bg-cyan-400/5" : "border-line-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><strong>{step.label}</strong>{current && <Badge variant={rejected ? "danger" : "info"}>Hiện tại</Badge>}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.detail}</p>
        </div>
      </li>;
    })}
  </ol>;
}

export function TrackOrder({ trackingCode }: { trackingCode: string }) {
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackOrder(trackingCode)
      .then((res) => {
        setOrder(res);
        // Sync status to localStorage
        try {
          const key = "mekong_recent_orders";
          const raw = localStorage.getItem(key);
          if (raw) {
            const existing = JSON.parse(raw) as Array<Record<string, unknown>>;
            const updated = existing.map((item) => {
              if (item.trackingCode === res.trackingCode) {
                return { ...item, status: res.status, planName: res.planName, estimatedAmount: res.estimatedAmount };
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        } catch {
          // ignore
        }
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Không thể tra cứu đơn hàng này."));
  }, [trackingCode]);

  return (
    <main className="py-16">
      <Container>
        {error ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <ErrorState description={error} />
            <div className="text-center">
              <Link
                href="/orders/track"
                className="inline-flex min-h-10 items-center rounded-xl bg-river-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-river-700"
              >
                ← Quay lại trang tra cứu đơn hàng
              </Link>
            </div>
          </div>
        ) : !order ? (
          <div className="py-20 text-center">
            <Clock3 size={36} className="mx-auto animate-spin opacity-50 text-river-600 dark:text-cyan-400" />
            <p role="status" className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              Đang tra cứu dữ liệu đơn hàng...
            </p>
          </div>
        ) : (
          <Card className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Mã tra cứu đơn hàng</p>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <h1 className="font-mono text-2xl font-bold text-river-700 dark:text-cyan-300 sm:text-3xl">
                    {order.trackingCode}
                  </h1>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(order.trackingCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-line-200 bg-ice-100/70 px-2.5 py-1 text-xs font-semibold text-river-700 transition-colors hover:bg-ice-100 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300"
                  >
                    {copied ? "✓ Đã sao chép" : "Sao chép mã"}
                  </button>
                </div>
              </div>
              <Badge variant={order.status === "Done" ? "success" : order.status === "Rejected" ? "danger" : "info"}>
                {labels[order.status]}
              </Badge>
            </div>

            <dl className="mt-8 grid gap-4 border-t border-line-200 pt-6 text-sm sm:grid-cols-2 dark:border-white/10">
              <div>
                <dt className="text-slate-600 dark:text-slate-300">Gói dịch vụ</dt>
                <dd className="mt-1 font-semibold">{order.planName}</dd>
              </div>
              <div>
                <dt className="text-slate-600 dark:text-slate-300">Chu kỳ thanh toán</dt>
                <dd className="mt-1 font-semibold">{order.billingCycle}</dd>
              </div>
              <div>
                <dt className="text-slate-600 dark:text-slate-300">Tổng ước tính</dt>
                <dd className="mt-1 font-semibold">
                  {new Intl.NumberFormat("vi-VN", { style: "currency", currency: order.currency, maximumFractionDigits: 0 }).format(order.estimatedAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600 dark:text-slate-300">Thời gian tạo</dt>
                <dd className="mt-1 font-semibold">{new Date(order.createdAt).toLocaleString("vi-VN")}</dd>
              </div>
            </dl>

            <OrderTimeline order={order} />

            {order.status === "New" && (
              <div className="mt-8 rounded-2xl border border-river-200 bg-river-50/60 p-5 text-sm leading-6 text-river-900 dark:border-cyan-400/20 dark:bg-cyan-400/5 dark:text-cyan-100">
                <strong>Chưa phát sinh thanh toán tự động.</strong> Đây là yêu cầu dịch vụ đang chờ nhân viên tiếp nhận. VietQR và xác nhận thanh toán chỉ được hiển thị sau khi backend có Payment Transaction và webhook đối soát thật, tránh tạo trạng thái tài chính giả trên giao diện.
              </div>
            )}

            {order.status === "Done" && <OrderTestimonialForm trackingCode={order.trackingCode} />}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line-200 pt-6 dark:border-white/10">
              <Link
                className="inline-flex items-center gap-1.5 font-semibold text-river-700 hover:underline dark:text-cyan-300 text-sm"
                href="/orders/track"
              >
                ← Tra cứu mã đơn khác
              </Link>
              <Link
                className="inline-flex items-center gap-1.5 font-semibold text-river-700 hover:underline dark:text-cyan-300 text-sm"
                href="/"
              >
                Về trang chủ →
              </Link>
            </div>
          </Card>
        )}
      </Container>
    </main>
  );
}
