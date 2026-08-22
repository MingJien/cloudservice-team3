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
import { createPromotion, getAdminPlans, getPromotions, setPromotionActive, updatePromotion } from "@/features/catalog/api";
import type { Plan, Promotion } from "@/features/catalog/types";
import { FormError, formatAmount, formatDate, toLocalDateTime, toUtc } from "./catalog-shared";

type PromotionForm = { code: string; name: string; discountType: string; discountValue: string; startAt: string; endAt: string; usageLimit: string; description: string; servicePlanIds: number[] };
const emptyPromotion: PromotionForm = { code: "", name: "", discountType: "Percentage", discountValue: "", startAt: "", endAt: "", usageLimit: "", description: "", servicePlanIds: [] };

export function PromotionsCrudView() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<PromotionForm>(emptyPromotion);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [pendingDisable, setPendingDisable] = useState<Promotion | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<Promotion | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const [promotions, planPage] = await Promise.all([getPromotions(), getAdminPlans()]); setItems(promotions); setPlans(planPage.items); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải khuyến mãi."); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([getPromotions(), getAdminPlans()]).then(([promotions, planPage]) => { if (active) { setItems(promotions); setPlans(planPage.items); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải khuyến mãi."); });
    return () => { active = false; };
  }, []);

  function edit(item: Promotion) { setEditing(item); setForm({ code: item.code, name: item.name, discountType: item.discountType, discountValue: String(item.discountValue), startAt: toLocalDateTime(item.startAt), endAt: toLocalDateTime(item.endAt), usageLimit: item.usageLimit == null ? "" : String(item.usageLimit), description: item.description ?? "", servicePlanIds: item.servicePlanIds }); }
  function reset() { setEditing(null); setForm(emptyPromotion); }
  function togglePlan(id: number) { setForm((current) => ({ ...current, servicePlanIds: current.servicePlanIds.includes(id) ? current.servicePlanIds.filter((value) => value !== id) : [...current.servicePlanIds, id] })); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { code: form.code.trim().toUpperCase(), name: form.name.trim(), discountType: form.discountType, discountValue: Number(form.discountValue), startAt: toUtc(form.startAt), endAt: toUtc(form.endAt), usageLimit: form.usageLimit ? Number(form.usageLimit) : null, description: form.description.trim() || null, servicePlanIds: form.servicePlanIds, rowVersion: editing?.rowVersion ?? null };
      if (editing) await updatePromotion(editing.id, payload); else await createPromotion(payload);
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu khuyến mãi."); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: Promotion, isActive: boolean) {
    setBusy(true); setError("");
    try { await setPromotionActive(item.id, isActive); setPendingDisable(null); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái khuyến mãi."); }
    finally { setBusy(false); }
  }

  async function hardDelete(item: Promotion) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/promotions/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-7xl animate-[sr-kf-fadeUp_0.6s_forwards]">
    <PageHeading title="Khuyến mãi" description="Quản lý mã, thời gian, giới hạn lượt dùng và phạm vi gói. Không chọn gói nghĩa là áp dụng toàn bộ gói đủ điều kiện." />
    <FormError message={error} />
    <Card><form className="grid gap-4 md:grid-cols-3 md:items-end" onSubmit={submit}>
      <Input label="Mã" name="promotion-code" required maxLength={50} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /><Input label="Tên" name="promotion-name" required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Select label="Loại giảm" name="promotion-type" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}><option value="Percentage">Phần trăm</option><option value="FixedAmount">Số tiền</option></Select>
      <Input label="Giá trị" name="promotion-value" type="number" min="0.01" step="any" required value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} /><Input label="Bắt đầu" name="promotion-start" type="datetime-local" required value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /><Input label="Kết thúc" name="promotion-end" type="datetime-local" required value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} />
      <Input label="Giới hạn lượt dùng" name="promotion-limit" type="number" min="1" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} /><Input label="Mô tả" name="promotion-description" maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
      <div className="md:col-span-3"><p className="mb-2 text-sm font-semibold">Phạm vi gói</p><div className="grid gap-2 rounded-xl border border-line-200 p-3 sm:grid-cols-2 lg:grid-cols-3 dark:border-white/10">{plans.filter((plan) => plan.isActive).map((plan) => <label key={plan.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.servicePlanIds.includes(plan.id)} onChange={() => togglePlan(plan.id)} /> #{plan.id} · {plan.name}</label>)}{plans.filter((plan) => plan.isActive).length === 0 && <p className="text-sm text-slate-500">Chưa có gói hoạt động.</p>}</div><p className="mt-2 text-xs text-slate-500">Đang chọn: {form.servicePlanIds.length ? `${form.servicePlanIds.length} gói` : "Toàn bộ gói"}</p></div>
      <div className="flex gap-2"><Button type="submit" isLoading={busy}>{editing ? "Lưu thay đổi" : "Tạo mã"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div>
    </form></Card>
    <div className="mt-6 grid gap-4 md:grid-cols-2">{items.map((item) => <Card key={item.id} className={!item.isActive ? "opacity-70" : undefined}><div className="flex items-start justify-between gap-4"><div><Badge variant={item.isActive ? "success" : "danger"}>{item.code}</Badge><h2 className="mt-3 text-lg font-bold">{item.name}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.discountType === "Percentage" ? `Giảm ${item.discountValue}%` : `Giảm ${formatAmount(item.discountValue)} VND`} · dùng {item.usedCount}{item.usageLimit == null ? "" : `/${item.usageLimit}`}</p><p className="mt-2 text-xs text-slate-500">{item.servicePlanIds.length ? `Áp dụng ${item.servicePlanIds.length} gói` : "Áp dụng toàn bộ gói"} · {formatDate(item.startAt)} → {formatDate(item.endAt)}</p></div><div className="flex flex-wrap justify-end gap-2">{item.isActive ? <><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button><Button variant="danger" onClick={() => setPendingDisable(item)}>Tắt</Button></> : <><Button variant="secondary" onClick={() => void changeStatus(item, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></div></Card>)}</div>
    <ConfirmDialog open={pendingDisable !== null} title={`Tắt mã ${pendingDisable?.code ?? ""}?`} description="Mã sẽ không còn được áp dụng cho báo giá và đơn mới. Số lượt đã dùng và lịch sử đơn không thay đổi; có thể khôi phục nếu mã vẫn hợp lệ." confirmLabel="Tắt mã" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable, false)} />
    <ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn mã ${pendingHardDelete?.code ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete)} />
  </div>;
}
