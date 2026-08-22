"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ScrollRevealList } from "@/components/ui/scroll-reveal-list";
import { Select } from "@/components/ui/select";
import { ZeroNumberInput } from "@/components/ui/zero-number-input";
import type { BillingCycle } from "@/features/pricing/types";
import { requestRecommendations } from "./api";
import type { RecommendationResponse, ServicePurpose, TrafficLevel } from "./types";

const purposes: Array<[ServicePurpose, string]> = [
  ["Website", "Website giới thiệu / nội dung"],
  ["Ecommerce", "Thương mại điện tử"],
  ["BusinessApplication", "Ứng dụng doanh nghiệp"],
  ["Development", "Môi trường phát triển"],
  ["Email", "Email doanh nghiệp"],
  ["General", "Nhu cầu tổng quát"],
];

const trafficLevels: Array<[TrafficLevel, string]> = [["Low", "Thấp"], ["Medium", "Trung bình"], ["High", "Cao"]];

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function AdvisorForm() {
  const [budget, setBudget] = useState("0");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("Monthly");
  const [purpose, setPurpose] = useState<ServicePurpose>("Website");
  const [traffic, setTraffic] = useState<TrafficLevel>("Medium");
  const [minimumCpuCores, setMinimumCpuCores] = useState("0");
  const [minimumRamGb, setMinimumRamGb] = useState("0");
  const [minimumStorageGb, setMinimumStorageGb] = useState("0");
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setResult(await requestRecommendations({
        budget: numberValue(budget),
        billingCycle,
        purpose,
        traffic,
        minimumCpuCores: numberValue(minimumCpuCores),
        minimumRamGb: numberValue(minimumRamGb),
        minimumStorageGb: numberValue(minimumStorageGb),
        maxResults: 3,
      }));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Không thể tư vấn gói lúc này.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Card>
        <form className="grid min-w-0 gap-5" onSubmit={submit}>
          <ZeroNumberInput label="Ngân sách mỗi chu kỳ (VND)" name="budget" min="0" step="1000" value={budget} onValueChange={setBudget} hint="Nhập 0 nếu chưa muốn giới hạn ngân sách." />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Chu kỳ" name="billingCycle" value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}><option value="Monthly">Hàng tháng</option><option value="Quarterly">Hàng quý</option><option value="Yearly">Hàng năm</option></Select>
            <Select label="Mức traffic" name="traffic" value={traffic} onChange={(event) => setTraffic(event.target.value as TrafficLevel)}>{trafficLevels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          </div>
          <Select label="Mục đích sử dụng" name="purpose" value={purpose} onChange={(event) => setPurpose(event.target.value as ServicePurpose)}>{purposes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
          <fieldset className="grid min-w-0 gap-4 rounded-2xl border border-line-200 p-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
            <legend className="px-2 text-sm font-semibold">Cấu hình tối thiểu</legend>
            <ZeroNumberInput label="vCPU" name="minimumCpuCores" min="0" value={minimumCpuCores} onValueChange={setMinimumCpuCores} />
            <ZeroNumberInput label="RAM (GB)" name="minimumRamGb" min="0" step="0.5" value={minimumRamGb} onValueChange={setMinimumRamGb} />
            <ZeroNumberInput label="Lưu trữ (GB)" name="minimumStorageGb" min="0" value={minimumStorageGb} onValueChange={setMinimumStorageGb} />
          </fieldset>
          <Button type="submit" isLoading={loading}>Phân tích nhu cầu</Button>
        </form>
      </Card>

      <section aria-live="polite" aria-label="Kết quả tư vấn">
        {error ? <ErrorState title="Không thể tạo gợi ý" description={error} /> : !result ? <EmptyState title="Chưa có kết quả tư vấn" description="Mỗi gợi ý sẽ có điểm và lý do cụ thể từ các quy tắc ngân sách, cấu hình, traffic và mục đích." /> : (
          <ScrollRevealList className="grid gap-4">
            {result.items.map((item, index) => <Card key={item.servicePlanId} className={index === 0 ? "border-river-600/45" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Badge variant={index === 0 ? "success" : "info"}>Gợi ý {index + 1}</Badge><span className="text-xs font-semibold text-slate-600">{item.score}/100 điểm</span></div><h2 className="mt-3 text-xl font-bold">{item.planName}</h2><p className="mt-1 text-sm text-slate-600">{item.categoryName} · Mã gói #{item.servicePlanId}</p></div><p className="text-xl font-bold text-river-700">{money(item.price, item.currency)}</p></div>
              <ul className="mt-5 grid gap-2 border-t border-line-200 pt-5 text-sm text-slate-600">{item.reasons.map((reason) => <li key={reason} className="grid grid-cols-[10px_1fr] gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-river-600" aria-hidden="true" /><span>{reason}</span></li>)}</ul>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d2e2ed] bg-white px-4 py-2 text-sm font-semibold text-[#10283f] transition-all hover:-translate-y-0.5 hover:border-[#9bc8e2] hover:bg-[#f2faff] dark:border-white/10 dark:bg-white/[0.055] dark:text-white" href={`/services#plan-${item.servicePlanId}`}>Xem chi tiết</Link>
                <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(115deg,#054b7b_0%,#075f9d_52%,#087ac1_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(11,139,216,.78)] transition-all hover:-translate-y-0.5 hover:saturate-110" href={`/order?planId=${item.servicePlanId}`}>Đặt hàng ngay</Link>
              </div>
            </Card>)}
          </ScrollRevealList>
        )}
      </section>
    </div>
  );
}
