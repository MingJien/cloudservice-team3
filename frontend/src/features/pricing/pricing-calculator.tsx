"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getPlans } from "@/features/catalog/api";
import type { Plan } from "@/features/catalog/types";
import { BillingCycleBadge, billingCycleLabels, billingCycles } from "./billing-cycle";
import { requestPricingQuote } from "./api";
import type { BillingCycle, PricingQuoteResponse } from "./types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function PricingCalculator() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servicePlanId, setServicePlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("Monthly");
  const [promotionCode, setPromotionCode] = useState("");
  const [result, setResult] = useState<PricingQuoteResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getPlans("pageNumber=1&pageSize=100")
      .then((page) => { if (active) setPlans(page.items); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh sách gói."); });
    return () => { active = false; };
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === Number(servicePlanId)) ?? null, [plans, servicePlanId]);
  const availableCycles = useMemo(() => selectedPlan ? [...new Set(selectedPlan.prices.map((price) => price.billingCycle))] : [], [selectedPlan]);

  function choosePlan(value: string) {
    setServicePlanId(value);
    setResult(null);
    const plan = plans.find((item) => item.id === Number(value));
    const firstCycle = plan?.prices[0]?.billingCycle;
    if (firstCycle) setBillingCycle(firstCycle);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) { setError("Hãy chọn một gói dịch vụ."); return; }
    if (!availableCycles.includes(billingCycle)) { setError("Gói chưa được bán ở chu kỳ đã chọn."); return; }
    setLoading(true); setError(""); setResult(null);
    try { setResult(await requestPricingQuote({ servicePlanId: selectedPlan.id, billingCycle, promotionCode: promotionCode.trim() || undefined })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tính giá lúc này."); }
    finally { setLoading(false); }
  }

  return <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-river-700">Báo giá trực tiếp từ API</p>
      <h2 className="mt-3 text-xl font-bold">Chọn gói và chu kỳ đang bán</h2>
      <form className="mt-6 grid gap-5" onSubmit={submit}>
        <Select label="Gói dịch vụ" name="servicePlanId" required value={servicePlanId} onChange={(event) => choosePlan(event.target.value)}><option value="">Chọn gói</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>Gói #{plan.id} · {plan.name}{plan.prices.length === 0 ? " — chưa mở bán" : ""}</option>)}</Select>
        <Select label="Chu kỳ thanh toán" name="billingCycle" disabled={availableCycles.length <= 1} value={availableCycles.includes(billingCycle) ? billingCycle : ""} onChange={(event) => setBillingCycle(event.target.value as BillingCycle)}><option value="" disabled>{selectedPlan && availableCycles.length === 0 ? "Gói chưa mở bán" : "Chọn chu kỳ"}</option>{billingCycles.map((cycle) => <option key={cycle} value={cycle} disabled={!availableCycles.includes(cycle)}>{billingCycleLabels[cycle]}{availableCycles.includes(cycle) ? "" : " — chưa bán"}</option>)}</Select>
        {selectedPlan && availableCycles.length === 0 && <p className="rounded-xl border border-warning-600/30 bg-warning-600/5 p-3 text-sm text-warning-600">Gói này chưa có mức giá đang hoạt động trong khoảng hiệu lực hiện tại.</p>}
        {availableCycles.length === 1 && <p className="text-xs text-slate-500">Gói chỉ bán theo {billingCycleLabels[availableCycles[0]].toLowerCase()}, nên chu kỳ được khóa đúng theo catalog.</p>}
        <Input label="Mã khuyến mãi (không bắt buộc)" name="promotionCode" maxLength={50} value={promotionCode} onChange={(event) => setPromotionCode(event.target.value.toUpperCase())} />
        <Button type="submit" isLoading={loading} disabled={!selectedPlan || availableCycles.length === 0}>Lấy báo giá từ API</Button>
      </form>
    </Card>
    <div aria-live="polite">{error ? <ErrorState title="Chưa thể lập báo giá" description={error} /> : result ? <Card className="h-full border-river-600/35"><div className="flex flex-wrap items-start justify-between gap-4"><div><BillingCycleBadge cycle={result.billingCycle} /><h2 className="mt-3 text-2xl font-bold">{result.planName}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Gói #{result.servicePlanId} · Bản giá #{result.planPriceId}</p></div>{result.promotion && <span className="rounded-full bg-success-600/10 px-3 py-1 text-xs font-bold text-success-600">Đã áp dụng {result.promotion.code}</span>}</div><dl className="mt-8 grid gap-4 border-y border-line-200 py-6 text-sm sm:grid-cols-2"><div><dt className="text-slate-600 dark:text-slate-300">Giá niêm yết</dt><dd className="mt-1 font-semibold">{money(result.originalPrice, result.currency)}</dd></div><div><dt className="text-slate-600 dark:text-slate-300">Giá gói hiệu lực</dt><dd className="mt-1 font-semibold">{money(result.effectivePlanPrice, result.currency)}</dd></div><div><dt className="text-slate-600 dark:text-slate-300">Giảm từ bảng giá</dt><dd className="mt-1 font-semibold text-success-600">-{money(result.planDiscountAmount, result.currency)}</dd></div><div><dt className="text-slate-600 dark:text-slate-300">Giảm từ khuyến mãi</dt><dd className="mt-1 font-semibold text-success-600">-{money(result.promotionDiscountAmount, result.currency)}</dd></div></dl><div className="mt-6 flex items-end justify-between gap-4"><div><p className="text-sm text-slate-600 dark:text-slate-300">Tổng ước tính</p><p className="mt-1 text-3xl font-bold text-river-700 dark:text-cyan-300">{money(result.totalPrice, result.currency)}</p></div><p className="max-w-48 text-right text-xs leading-5 text-slate-600 dark:text-slate-300">Kết quả ước tính, chưa phải hóa đơn hoặc xác nhận thanh toán.</p></div></Card> : <Card className="grid min-h-90 place-items-center border-dashed text-center"><div><p className="text-lg font-semibold">Chưa có báo giá</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Chọn gói và một chu kỳ đang bán. Khu vực này chỉ hiển thị dữ liệu do API tính.</p></div></Card>}</div>
  </div>;
}
