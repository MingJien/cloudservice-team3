"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Clock3, Search, Trash2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SavedOrder {
  trackingCode: string;
  planName: string;
  billingCycle: string;
  estimatedAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; variant: "info" | "success" | "danger" }> = {
  New: { label: "Mới tiếp nhận", variant: "info" },
  Processing: { label: "Đang xử lý", variant: "info" },
  Done: { label: "Hoàn tất", variant: "success" },
  Rejected: { label: "Từ chối", variant: "danger" },
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function TrackOrderSearch() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [recentOrders, setRecentOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mekong_recent_orders");
      if (raw) {
        const parsed = JSON.parse(raw) as SavedOrder[];
        if (Array.isArray(parsed)) {
          queueMicrotask(() => setRecentOrders(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Vui lòng nhập mã tra cứu (ví dụ: ORD-5BCU7KWMLH).");
      return;
    }
    if (!clean.startsWith("ORD-") && clean.length < 6) {
      setError("Mã tra cứu không đúng định dạng. Mã chuẩn có dạng: ORD-XXXXXXXXXX.");
      return;
    }
    setError("");
    router.push(`/orders/track/${encodeURIComponent(clean)}`);
  }

  function clearRecentOrders() {
    try {
      localStorage.removeItem("mekong_recent_orders");
      setRecentOrders([]);
    } catch {
      // ignore
    }
  }

  function removeRecentOrder(trackingCode: string) {
    try {
      const updated = recentOrders.filter((item) => item.trackingCode !== trackingCode);
      localStorage.setItem("mekong_recent_orders", JSON.stringify(updated));
      setRecentOrders(updated);
    } catch {
      // ignore
    }
  }

  return (
    <main className="py-12 md:py-16">
      <Container>
        <PageHeading
          title="Tra cứu tiến trình đơn hàng"
          description="Nhập mã tra cứu duy nhất được cấp khi tạo đơn (ORD-...) để theo dõi trạng thái xử lý trực tiếp từ backend theo thời gian thực."
        />

        <div className="mx-auto max-w-4xl grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Main search box */}
          <div className="space-y-6">
            <Card className="border-river-500/25 shadow-lg shadow-river-500/5">
              <h2 className="text-lg font-bold">Tra cứu theo mã đơn</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Nhập mã tra cứu đơn hàng để kiểm tra tiến trình xác minh và kích hoạt dịch vụ.
              </p>

              <form className="mt-6 grid gap-4" onSubmit={handleSearch}>
                <Input
                  label="Mã tra cứu đơn hàng"
                  name="trackingCode"
                  placeholder="Ví dụ: ORD-5BCU7KWMLH"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError("");
                  }}
                  error={error}
                  hint="Mã bắt đầu bằng ORD- gồm chữ và số được cấp lúc bạn gửi yêu cầu đặt dịch vụ."
                />

                <Button type="submit" className="w-full flex items-center justify-center gap-2">
                  <Search size={16} />
                  Tra cứu trạng thái ngay
                </Button>
              </form>
            </Card>

            {/* Quick FAQ */}
            <Card>
              <h3 className="text-base font-bold">Thông tin hỗ trợ tra cứu</h3>
              <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-river-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Mã tra cứu lấy ở đâu?</strong>
                    <p className="mt-0.5 text-xs leading-5">
                      Mã được sinh tự động ngay sau khi bạn gửi form đặt dịch vụ. Nếu bạn đặt trên thiết bị này, mã sẽ được tự động lưu bên dưới.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock3 size={18} className="text-river-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Thời gian tiếp nhận và xử lý?</strong>
                    <p className="mt-0.5 text-xs leading-5">
                      Đội ngũ kỹ thuật MekongNode sẽ tiếp nhận yêu cầu trong vòng 15-30 phút làm việc để xác nhận cấu hình và bàn giao dịch vụ.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-river-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-200">Cần tư vấn hỗ trợ gấp?</strong>
                    <p className="mt-0.5 text-xs leading-5">
                      Liên hệ hotline hoặc qua trang <Link href="/contact" className="text-river-600 underline dark:text-cyan-300">Liên hệ tư vấn</Link> để được hỗ trợ nhanh chóng.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent orders on this device */}
          <div>
            <Card className="h-full">
              <div className="flex items-center justify-between gap-2 border-b border-line-200 pb-3 dark:border-white/10">
                <div>
                  <h3 className="font-bold">Đơn hàng gần đây</h3>
                  <p className="text-xs text-slate-500">Lưu tự động trên trình duyệt này</p>
                </div>
                {recentOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentOrders}
                    className="text-xs text-slate-400 hover:text-danger-600 transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Clock3 size={32} className="mx-auto mb-3 opacity-40 text-river-600 dark:text-cyan-400" />
                  <p className="text-sm font-medium">Chưa có đơn hàng nào lưu trên thiết bị này.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Khi bạn gửi yêu cầu đặt dịch vụ, thông tin mã đơn sẽ xuất hiện tại đây để bạn tiện xem lại.
                  </p>
                  <Link
                    href="/order"
                    className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-river-600 hover:underline dark:text-cyan-300"
                  >
                    Đặt dịch vụ mới →
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {recentOrders.map((item) => {
                    const statusInfo = statusMap[item.status] ?? { label: item.status, variant: "info" };
                    return (
                      <li
                        key={item.trackingCode}
                        className="group relative rounded-xl border border-line-200 bg-white/70 p-3.5 transition-all hover:border-river-500/40 hover:shadow-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-sm font-bold text-river-700 dark:text-cyan-300">
                              {item.trackingCode}
                            </span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                              {item.planName}
                            </p>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                          <span>{formatMoney(item.estimatedAmount, item.currency)}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-line-200/60 pt-2 dark:border-white/5">
                          <Link
                            href={`/orders/track/${item.trackingCode}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-river-600 hover:text-river-700 dark:text-cyan-300"
                          >
                            Xem tiến trình <ArrowRight size={12} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeRecentOrder(item.trackingCode)}
                            className="text-slate-400 hover:text-danger-600 transition-colors"
                            aria-label={`Xóa mã ${item.trackingCode}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
