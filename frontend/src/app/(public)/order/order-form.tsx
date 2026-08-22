"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createOrder, type OrderCreated } from "@/features/orders/api";
import { getPlans } from "@/features/catalog/api";
import type { Plan } from "@/features/catalog/types";
import { BillingCycleBadge, billingCycleLabels, billingCycles } from "@/features/pricing/billing-cycle";
import type { BillingCycle } from "@/features/pricing/types";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { AFFILIATE_CODE_COOKIE, AFFILIATE_VISIT_COOKIE, normalizeAffiliateCode, readBrowserCookie } from "@/features/affiliates/tracking";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function OrderForm({ initialPlanId, initialPromotionCode = "" }: { initialPlanId?: number; initialPromotionCode?: string }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState(String(initialPlanId ?? ""));
  const [cycle, setCycle] = useState<BillingCycle>("Monthly");
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", note: "", promotion: initialPromotionCode });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<OrderCreated | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const submissionAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    getPlans("pageNumber=1&pageSize=100").then((page) => {
      if (!active) return;
      setPlans(page.items);
      const initial = page.items.find((plan) => plan.id === initialPlanId);
      if (initial?.prices[0]) setCycle(initial.prices[0].billingCycle);
    }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh sách gói."); });
    return () => { active = false; };
  }, [initialPlanId]);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === Number(planId)) ?? null, [plans, planId]);
  const availableCycles = useMemo(() => selectedPlan ? [...new Set(selectedPlan.prices.map((price) => price.billingCycle))] : [], [selectedPlan]);
  const selectedPrice = selectedPlan?.prices.find((price) => price.billingCycle === cycle) ?? null;

  function field(name: keyof typeof form, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, phone: digits }));
  }

  const phoneValidation = useMemo(() => {
    if (!form.phone && !phoneFocused) {
      return { hint: "", error: undefined, isValid: false };
    }
    if (!form.phone && phoneFocused) {
      return { hint: undefined, error: undefined, isValid: false };
    }
    if (!form.phone.startsWith("0")) {
      return { error: "Số điện thoại phải bắt đầu bằng số 0 (ví dụ: 0912345678).", hint: undefined, isValid: false };
    }
    if (form.phone.length < 10) {
      return { hint: `Đang nhập: ${form.phone.length}/10 số (còn thiếu ${10 - form.phone.length} số)`, error: undefined, isValid: false };
    }
    return { hint: "✓ Số điện thoại hợp lệ (10 số)", error: undefined, isValid: true };
  }, [form.phone, phoneFocused]);

  function choosePlan(value: string) {
    setPlanId(value);
    const plan = plans.find((item) => item.id === Number(value));
    if (plan?.prices[0]) setCycle(plan.prices[0].billingCycle);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) { setError("Hãy chọn gói dịch vụ."); return; }
    if (!selectedPrice) { setError("Gói chưa được bán ở chu kỳ đã chọn."); return; }
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0 (ví dụ: 0912345678).");
      return;
    }
    setLoading(true); setError("");
    try {
      const affiliateCode = normalizeAffiliateCode(readBrowserCookie(AFFILIATE_CODE_COOKIE));
      const affiliateVisitId = readBrowserCookie(AFFILIATE_VISIT_COOKIE);
      const payload = {
        servicePlanId: selectedPlan.id,
        billingCycle: cycle,
        promotionCode: form.promotion.trim() || undefined,
        customerName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyName: form.company.trim() || undefined,
        note: form.note.trim() || undefined,
        affiliateCode: affiliateCode || undefined,
        affiliateVisitId: affiliateVisitId && /^[0-9a-f-]{36}$/i.test(affiliateVisitId) ? affiliateVisitId : undefined,
      };
      const fingerprint = JSON.stringify(payload);
      if (!submissionAttempt.current || submissionAttempt.current.fingerprint !== fingerprint) {
        submissionAttempt.current = { fingerprint, key: crypto.randomUUID() };
      }
      const res = await createOrder(payload, submissionAttempt.current.key);

      // Save to localStorage so user can easily track it later
      try {
        const key = "mekong_recent_orders";
        const raw = localStorage.getItem(key);
        const existing = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
        const record = {
          trackingCode: res.trackingCode,
          planName: res.planName,
          billingCycle: res.billingCycle,
          estimatedAmount: res.estimatedAmount,
          currency: res.currency,
          status: res.status,
          createdAt: res.createdAt,
        };
        const updated = [record, ...existing.filter((item) => item.trackingCode !== res.trackingCode)].slice(0, 10);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // ignore localStorage errors
      }

      setSuccess(res);
      submissionAttempt.current = null;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể gửi yêu cầu."); }
    finally { setLoading(false); }
  }

  if (success) return (
    <main className="py-16">
      <Container>
        <Card className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-success-600">Đã tiếp nhận yêu cầu</p>
          <h1 className="mt-3 text-3xl font-bold">Yêu cầu đã được tạo thành công</h1>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="font-mono text-2xl font-bold text-river-700 dark:text-cyan-300 sm:text-3xl">
              {success.trackingCode}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(success.trackingCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 bg-ice-100/80 px-3.5 py-1.5 text-xs font-semibold text-river-700 transition-colors hover:bg-ice-100 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300 dark:hover:bg-white/10"
            >
              {copiedCode ? "✓ Đã sao chép mã" : "Sao chép mã"}
            </button>
          </div>

          <div className="mx-auto mt-6 max-w-md rounded-xl border border-line-200 p-4 text-left text-sm dark:border-white/10">
            <p><strong>{success.planName}</strong></p>
            <p className="mt-2"><BillingCycleBadge cycle={success.billingCycle} /></p>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Tổng ước tính: {money(success.estimatedAmount, success.currency)}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Trạng thái: <span className="font-semibold text-river-600 dark:text-cyan-300">Mới tiếp nhận</span></p>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Hãy lưu mã tra cứu. Đội ngũ kỹ thuật sẽ tiếp nhận và cập nhật tiến trình xử lý trong thời gian sớm nhất. Bạn có thể theo dõi trực tiếp trạng thái bất cứ lúc nào.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex min-h-11 items-center rounded-xl bg-river-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-river-600/20 transition-all hover:bg-river-700"
              href={`/orders/track/${success.trackingCode}`}
            >
              Theo dõi tiến trình đơn hàng →
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-xl border border-line-200 px-4 py-2 text-sm font-semibold transition-colors hover:bg-ice-100 dark:border-white/10 dark:hover:bg-white/5"
              href="/orders/track"
            >
              Tra cứu đơn khác
            </Link>
            <Link
              className="inline-flex min-h-11 items-center rounded-xl border border-line-200 px-4 py-2 text-sm font-semibold transition-colors hover:bg-ice-100 dark:border-white/10 dark:hover:bg-white/5"
              href="/"
            >
              Về trang chủ
            </Link>
          </div>
        </Card>
      </Container>
    </main>
  );

  return (
    <main className="py-12 md:py-16">
      <Container>
        <PageHeading
          title="Đặt dịch vụ / nhận tư vấn"
          description="Chọn đúng chu kỳ đang bán. Backend chốt giá, lưu snapshot gói và sinh mã tra cứu để đơn không bị thay đổi khi catalog cập nhật."
        />
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.58fr]">
          <div>
            {error && <div className="mb-5"><ErrorState description={error} /></div>}
            <Card>
              <form className="grid gap-5" onSubmit={submit}>
                <Select
                  label="Gói dịch vụ"
                  name="planId"
                  required
                  value={planId}
                  onChange={(event) => choosePlan(event.target.value)}
                >
                  <option value="">Chọn gói</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      #{plan.id} · {plan.name} · {plan.categoryName}
                      {plan.prices.length === 0 ? " — chưa mở bán" : ""}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Chu kỳ thanh toán"
                  name="cycle"
                  disabled={availableCycles.length <= 1}
                  value={availableCycles.includes(cycle) ? cycle : ""}
                  onChange={(event) => setCycle(event.target.value as BillingCycle)}
                >
                  <option value="" disabled>
                    {selectedPlan && availableCycles.length === 0 ? "Gói chưa mở bán" : "Chọn chu kỳ"}
                  </option>
                  {billingCycles.map((value) => (
                    <option key={value} value={value} disabled={!availableCycles.includes(value)}>
                      {billingCycleLabels[value]}
                      {availableCycles.includes(value) ? "" : " — chưa bán"}
                    </option>
                  ))}
                </Select>

                {selectedPlan && availableCycles.length === 0 && (
                  <p className="rounded-xl border border-warning-600/30 bg-warning-600/5 p-3 text-sm text-warning-600">
                    Gói chưa có mức giá đang hiệu lực nên chưa thể đặt.
                  </p>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Họ và tên"
                    name="name"
                    required
                    maxLength={150}
                    value={form.name}
                    onChange={(event) => field("name", event.target.value)}
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    value={form.email}
                    onChange={(event) => field("email", event.target.value)}
                  />
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="nhập đúng 10 chữ số"
                    value={form.phone}
                    error={phoneValidation.error}
                    hint={phoneValidation.hint}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => {
                      setPhoneFocused(false);
                    }}
                  />
                  <Input
                    label="Doanh nghiệp (không bắt buộc)"
                    name="company"
                    maxLength={200}
                    value={form.company}
                    onChange={(event) => field("company", event.target.value)}
                  />
                </div>

                <Input
                  label="Mã khuyến mãi (nếu có)"
                  name="promotion"
                  maxLength={50}
                  value={form.promotion}
                  onChange={(event) => field("promotion", event.target.value.toUpperCase())}
                />

                <label className="grid gap-2 text-sm font-medium">
                  Nhu cầu thêm
                  <textarea
                    className="min-h-32 rounded-xl border border-line-200 bg-white px-3 py-2 outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15 dark:border-white/10 dark:bg-white/5"
                    maxLength={2000}
                    value={form.note}
                    onChange={(event) => field("note", event.target.value)}
                  />
                </label>

                <Button type="submit" isLoading={loading} disabled={!selectedPrice}>
                  Gửi yêu cầu
                </Button>
              </form>
            </Card>
          </div>

          <div className="grid h-fit gap-4">
            <Card>
              <p className="text-sm font-semibold">Tóm tắt lựa chọn</p>
              {selectedPlan ? (
                <div className="mt-4">
                  <h2 className="text-xl font-bold">{selectedPlan.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">Gói #{selectedPlan.id} · {selectedPlan.categoryName}</p>
                  {selectedPrice ? (
                    <div className="mt-4">
                      <BillingCycleBadge cycle={cycle} />
                      <p className="mt-3 text-2xl font-bold text-river-700 dark:text-cyan-300">
                        {money(selectedPrice.effectivePrice, selectedPrice.currency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Chưa gồm mã khuyến mãi; API tính lại khi gửi.</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-warning-600">Chưa mở bán.</p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Chọn một gói để xem giá.</p>
              )}
            </Card>

            <Card>
              <p className="text-sm font-semibold">Luồng xử lý minh bạch</p>
              <ol className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                <li><strong>1. Mới:</strong> hệ thống đã lưu yêu cầu & cấp mã tra cứu.</li>
                <li><strong>2. Đang xử lý:</strong> nhân viên kỹ thuật đã tiếp nhận.</li>
                <li><strong>3. Hoàn tất / Từ chối:</strong> trạng thái kết thúc được cập nhật minh bạch.</li>
              </ol>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
