"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createPrice, getAdminPlans, restorePrice, setPriceActive, updatePrice } from "@/features/catalog/api";
import type { Plan, Price } from "@/features/catalog/types";
import { BillingCycleBadge, billingCycleLabels } from "@/features/pricing/billing-cycle";
import type { BillingCycle } from "@/features/pricing/types";
import { FormError, formatAmount, formatDate, nowLocalDateTime, priceWindow, toLocalDateTime, toUtc } from "./catalog-shared";

type PriceForm = { planId: string; billingCycle: BillingCycle; originalPrice: string; discountPercent: string; currency: string; effectiveFrom: string; effectiveTo: string };
function emptyPrice(): PriceForm { return { planId: "", billingCycle: "Monthly", originalPrice: "", discountPercent: "0", currency: "VND", effectiveFrom: nowLocalDateTime(), effectiveTo: "" }; }

export function PricesCrudView() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<PriceForm>(() => emptyPrice());
  const [editing, setEditing] = useState<{ planId: number; price: Price } | null>(null);
  const [pendingDisable, setPendingDisable] = useState<{ plan: Plan; price: Price } | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<{ plan: Plan; price: Price } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [displayPrice, setDisplayPrice] = useState("");

  const load = useCallback(async () => {
    try { setPlans((await getAdminPlans()).items); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải bảng giá."); }
  }, []);
  useEffect(() => {
    let active = true;
    getAdminPlans().then((page) => { if (active) { setPlans(page.items); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải bảng giá."); });
    return () => { active = false; };
  }, []);

  function edit(planId: number, price: Price) {
    setEditing({ planId, price });
    const discountPercent = price.salePrice == null || price.originalPrice === 0 ? 0 : ((price.originalPrice - price.salePrice) / price.originalPrice) * 100;
    setForm({ planId: String(planId), billingCycle: price.billingCycle, originalPrice: String(price.originalPrice), discountPercent: String(Number(discountPercent.toFixed(2))), currency: price.currency, effectiveFrom: toLocalDateTime(price.effectiveFrom), effectiveTo: toLocalDateTime(price.effectiveTo) });
    setDisplayPrice(price.originalPrice ? formatAmount(price.originalPrice) : "");
  }
  function reset() { 
    setEditing(null); 
    setForm(emptyPrice()); 
    setDisplayPrice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const originalPrice = Number(form.originalPrice);
      const discountPercent = Number(form.discountPercent || 0);
      if (!form.planId || !Number.isFinite(originalPrice) || originalPrice < 0) throw new Error("Vui lòng chọn gói và nhập giá gốc hợp lệ.");
      if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) throw new Error("Mức giảm trực tiếp phải nằm trong khoảng 0-100%.");
      if (form.effectiveFrom && form.effectiveTo && new Date(form.effectiveTo) <= new Date(form.effectiveFrom)) throw new Error("Hiệu lực đến phải sau hiệu lực từ.");
      const salePrice = discountPercent > 0 ? Math.round(originalPrice * (1 - discountPercent / 100)) : null;
      const payload = { billingCycle: form.billingCycle, originalPrice, salePrice, currency: form.currency.trim().toUpperCase(), effectiveFrom: toUtc(form.effectiveFrom), effectiveTo: toUtc(form.effectiveTo), rowVersion: editing?.price.rowVersion ?? null };
      if (editing) await updatePrice(editing.price.id, payload); else await createPrice(Number(form.planId), payload);
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu bảng giá."); }
    finally { setBusy(false); }
  }

  async function changeStatus(price: Price, isActive: boolean) {
    setBusy(true); setError("");
    try { if (isActive) await restorePrice(price.id); else await setPriceActive(price.id, false); setPendingDisable(null); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái giá."); }
    finally { setBusy(false); }
  }

  async function hardDelete(price: Price) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/plan-prices/${price.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn mức giá."); }
    finally { setBusy(false); }
  }

  const handleOriginalPriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^0-9]/g, "");
    setForm((prev) => ({ ...prev, originalPrice: raw }));
    setDisplayPrice(raw);
  };

  const handleOriginalPriceBlur = () => {
    if (form.originalPrice) {
      setDisplayPrice(formatAmount(Number(form.originalPrice)));
    } else {
      setDisplayPrice("");
    }
  };

  const handleOriginalPriceFocus = () => {
    if (form.originalPrice) {
      setDisplayPrice(form.originalPrice);
    }
  };

  const handleCurrencyChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = event.target.value;
    const oldCurrency = form.currency;
    if (oldCurrency === newCurrency) return;
    setForm((prev) => ({ ...prev, currency: newCurrency }));
    
    let rate = 25400; // Fallback rate
    setError("");
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("API down");
      const data = await res.json();
      if (data?.rates?.VND) rate = data.rates.VND;
    } catch {
      setError("Không thể gọi API tỷ giá động từ thị trường. Đang sử dụng tỷ giá dự phòng (1 USD = 25.400 VND).");
    }

    setForm((prev) => {
      let numericPrice = Number(prev.originalPrice) || 0;
      if (oldCurrency === "VND" && newCurrency === "USD") {
        numericPrice = Math.round(numericPrice / rate);
      } else if (oldCurrency === "USD" && newCurrency === "VND") {
        numericPrice = Math.round(numericPrice * rate);
      }
      const newStr = numericPrice.toString();
      setDisplayPrice(numericPrice ? formatAmount(numericPrice) : "");
      return { ...prev, originalPrice: newStr };
    });
  };

  const originalPrice = Number(form.originalPrice) || 0;
  const discountPercent = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const effectivePrice = Math.round(originalPrice * (1 - discountPercent / 100));

  const plansPerPage = 5;
  const totalPages = Math.ceil(plans.length / plansPerPage);
  const displayedPlans = plans.slice((currentPage - 1) * plansPerPage, currentPage * plansPerPage);

  return <div className="mx-auto max-w-7xl animate-[sr-kf-fadeUp_0.6s_forwards]">
    <PageHeading title="Bảng giá" description="Mỗi chu kỳ có các khoảng hiệu lực không chồng lấn. Quote, order và landing chỉ đọc mức giá đang bật và đang nằm trong khoảng hiệu lực." />
    <FormError message={error} />
    <Card><form className="grid gap-4 md:grid-cols-4 items-start" onSubmit={submit}>
      <Select label="Gói" name="price-plan" required disabled={Boolean(editing)} value={form.planId} onChange={(event) => setForm({ ...form, planId: event.target.value })}><option value="">Chọn gói đang hoạt động</option>{plans.filter((plan) => plan.isActive).map((plan) => <option key={plan.id} value={plan.id}>#{plan.id} · {plan.name}</option>)}</Select>
      <Select label="Chu kỳ" name="price-cycle" value={form.billingCycle} onChange={(event) => setForm({ ...form, billingCycle: event.target.value as BillingCycle })}><option value="Monthly">Hàng tháng</option><option value="Quarterly">Hàng quý</option><option value="Yearly">Hàng năm</option></Select>
      <Input 
        label="Giá gốc" 
        name="price-original" 
        type="text" 
        required 
        value={displayPrice} 
        onChange={handleOriginalPriceChange} 
        onBlur={handleOriginalPriceBlur}
        onFocus={handleOriginalPriceFocus}
        placeholder="1.000.000" 
      />
      <Input label="Giảm trực tiếp (%)" name="price-discount" type="number" min="0" max="100" step="0.01" value={form.discountPercent} onChange={(event) => setForm({ ...form, discountPercent: event.target.value })} placeholder="0" />
      <Input label="Giá hiệu lực (chỉ đọc)" name="price-effective" value={`${formatAmount(effectivePrice)} ${form.currency}`} disabled hint="Tự tính = Giá gốc − (Giá gốc × % giảm trực tiếp)." />
      <Select label="Tiền tệ" name="price-currency" required value={form.currency} onChange={handleCurrencyChange}>
        <option value="VND">VND</option>
        <option value="USD">USD</option>
      </Select>
      <Input label="Hiệu lực từ" name="price-from" type="datetime-local" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} />
      <Input label="Hiệu lực đến" name="price-to" type="datetime-local" value={form.effectiveTo} onChange={(event) => setForm({ ...form, effectiveTo: event.target.value })} />
      <div className="flex gap-2 md:col-span-4 pt-1"><Button type="submit" isLoading={busy}>{editing ? "Lưu thay đổi" : "Thêm giá"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div>
    </form></Card>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{displayedPlans.map((plan) => <Card key={plan.id}><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-river-700 dark:text-cyan-300">#{plan.id} · {plan.name}</h2><p className="mt-1 text-xs text-slate-500">{plan.isActive ? "Gói đang hoạt động" : "Gói đang tắt"}</p></div><Badge variant="info">{plan.prices.length} mức giá</Badge></div><div className="mt-4 grid gap-3">{plan.prices.length === 0 && <p className="rounded-xl border border-dashed border-line-200 p-4 text-sm text-slate-500">Chưa có bảng giá; gói chưa thể bán.</p>}{plan.prices.map((price) => { const window = priceWindow(price); return <div key={price.id} className="rounded-xl border border-line-200 p-4 dark:border-white/10"><div className="flex flex-wrap items-center gap-2"><BillingCycleBadge cycle={price.billingCycle} /><Badge variant={window.variant}>{window.label}</Badge><span className="ml-auto text-xs text-slate-500">#{price.id}</span></div><div className="mt-3 flex items-end justify-between gap-3"><div>{price.salePrice !== null && <p className="text-sm text-slate-500 line-through">{formatAmount(price.originalPrice)} {price.currency}</p>}<strong className="text-xl tracking-tight">{formatAmount(price.effectivePrice)} {price.currency}</strong></div><div className="flex gap-2">{price.isActive ? <><Button variant="secondary" onClick={() => edit(plan.id, price)}>Sửa</Button><Button variant="danger" onClick={() => setPendingDisable({ plan, price })}>Tắt</Button></> : <><Button variant="secondary" onClick={() => void changeStatus(price, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => setPendingHardDelete({ plan, price })}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></div><p className="mt-3 text-xs leading-5 text-slate-500">Từ: {formatDate(price.effectiveFrom)}<br />Đến: {formatDate(price.effectiveTo)}</p></div>; })}</div></Card>)}</div>
    {totalPages > 1 && (
      <div className="mt-6 flex items-center justify-center gap-4">
        <Button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>Trước</Button>
        <span className="text-sm font-medium">Trang {currentPage} / {totalPages}</span>
        <Button variant="secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Sau</Button>
      </div>
    )}
    <ConfirmDialog open={pendingDisable !== null} title={`Tắt giá ${pendingDisable ? billingCycleLabels[pendingDisable.price.billingCycle] : ""}?`} description={`Mức ${pendingDisable ? formatAmount(pendingDisable.price.effectivePrice) : ""} VND của gói ${pendingDisable?.plan.name ?? ""} sẽ ngừng xuất hiện ở báo giá, landing và form đặt hàng. Bản ghi vẫn được giữ để khôi phục.`} confirmLabel="Tắt mức giá" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable.price, false)} />
    <ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn mức giá này?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete.price)} />
  </div>;
}
