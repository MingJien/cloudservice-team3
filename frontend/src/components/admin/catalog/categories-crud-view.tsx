"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { CategoryIcon, categoryIconOptions } from "@/components/brand/category-icon";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { createCategory, getAdminCategories, getCategoryDisableImpact, restoreCategory, setCategoryActive, updateCategory } from "@/features/catalog/api";
import type { Category, CategoryDisableImpact } from "@/features/catalog/types";
import { FormError } from "./catalog-shared";

type CategoryForm = { name: string; slug: string; description: string; icon: string; displayOrder: string };
const emptyCategory: CategoryForm = { name: "", slug: "", description: "", icon: "zap", displayOrder: "0" };

export function CategoriesCrudView() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pendingDisable, setPendingDisable] = useState<{ item: Category; impact: CategoryDisableImpact } | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<{ item: Category; impact: CategoryDisableImpact } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "deleted">("active");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItems((await getAdminCategories()).items); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải danh mục."); }
  }, []);
  useEffect(() => {
    let active = true;
    getAdminCategories().then((page) => { if (active) { setItems(page.items); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh mục."); });
    return () => { active = false; };
  }, []);

  function edit(item: Category) {
    setEditing(item);
    setForm({ name: item.name, slug: item.slug, description: item.description ?? "", icon: item.icon ?? "zap", displayOrder: String(item.displayOrder) });
  }
  function reset() { setEditing(null); setForm(emptyCategory); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, icon: form.icon, displayOrder: Number(form.displayOrder) };
      if (editing) await updateCategory(editing.id, payload); else await createCategory(payload);
      reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu danh mục."); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: Category, isActive: boolean) {
    setBusy(true); setError("");
    try { if (isActive) await restoreCategory(item.id); else await setCategoryActive(item.id, false); setPendingDisable(null); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái danh mục."); }
    finally { setBusy(false); }
  }

  async function hardDelete(item: Category) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/service-categories/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn danh mục. Hãy chắc chắn danh mục không còn gói dịch vụ nào."); }
    finally { setBusy(false); }
  }

  async function prepareDisable(item: Category, isHardDelete: boolean = false) {
    setBusy(true); setError("");
    try { 
        if (isHardDelete) setPendingHardDelete({ item, impact: await getCategoryDisableImpact(item.id) });
        else setPendingDisable({ item, impact: await getCategoryDisableImpact(item.id) }); 
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể kiểm tra ảnh hưởng của danh mục."); }
    finally { setBusy(false); }
  }

  const visibleItems = items.filter((item) => statusFilter === "active" ? item.isActive && !item.isDeleted : item.isDeleted || !item.isActive);

  return <div className="mx-auto max-w-7xl animate-[sr-kf-fadeUp_0.6s_forwards]">
    <PageHeading title="Danh mục dịch vụ" description="Icon được chọn theo khóa cố định và hiển thị nhất quán ở admin lẫn landing. Tắt là soft-disable, không xóa dữ liệu con." />
    <FormError message={error} />
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}>
        <Input label="Tên" name="category-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Slug" name="category-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={150} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} hint="Chữ thường, số và gạch ngang; ví dụ cloud-vps." />
        <Input label="Mô tả" name="category-description" maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <Select label="Biểu tượng" name="category-icon" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })}>{categoryIconOptions.map((option) => <option key={option.value} value={option.value}>{option.label} ({option.value})</option>)}</Select>
        <Input label="Thứ tự" name="category-order" type="number" min="0" required value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
        <div className="flex flex-wrap gap-2"><Button type="submit" isLoading={busy}>{editing ? "Lưu thay đổi" : "Tạo danh mục"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div>
      </form></Card>
      <div className="grid content-start gap-3"><Select label="Trạng thái" name="category-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "active" | "deleted")}><option value="active">Đang hoạt động</option><option value="deleted">Đã tắt</option></Select><TableShell isEmpty={visibleItems.length === 0} emptyTitle={statusFilter === "active" ? "Chưa có danh mục hoạt động" : "Chưa có danh mục đã tắt"}><DataTable caption="Danh mục dịch vụ"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Gói dịch vụ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{visibleItems.map((item) => <tr key={item.id} className={!item.isActive ? "opacity-70" : undefined}><td className="px-4 py-3"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-ice-100 text-river-700 dark:bg-white/5 dark:text-cyan-300"><CategoryIcon iconKey={item.icon} slug={item.slug} size={19} /></span><span><strong>{item.name}</strong><span className="block font-mono text-xs text-slate-500">{item.slug} · {item.icon ?? "tự suy luận"}</span></span></span></td><td className="px-4 py-3 text-sm"><strong>{item.activePlanCount}</strong> hoạt động / {item.totalPlanCount} tổng</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Hoạt động" : "Đã tắt"}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-2">{item.isActive ? <><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button><Button variant="danger" onClick={() => void prepareDisable(item, false)}>Tắt</Button></> : <><Button variant="secondary" onClick={() => void changeStatus(item, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => void prepareDisable(item, true)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell></div>
    </div>
    <ConfirmDialog open={pendingDisable !== null} title={`Tắt danh mục ${pendingDisable?.item.name ?? ""}?`} description={pendingDisable && pendingDisable.impact.activePlanCount > 0 ? `Danh mục có ${pendingDisable.impact.activePlanCount} dịch vụ đang hoạt động. Tắt danh mục sẽ ẩn tất cả dịch vụ này ở ngoài trang chủ. Bản ghi vẫn ở DB và có thể khôi phục. Xác nhận?` : "Danh mục chưa có dịch vụ hoạt động. Bản ghi vẫn ở DB và có thể khôi phục. Xác nhận tắt?"} confirmLabel="Tắt danh mục" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable.item, false)} />
    <ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn danh mục ${pendingHardDelete?.item.name ?? ""}?`} description={pendingHardDelete && pendingHardDelete.impact.totalPlanCount > 0 ? `Cảnh báo: Danh mục này đang chứa ${pendingHardDelete.impact.totalPlanCount} gói dịch vụ. Bạn không thể xóa vĩnh viễn nếu chưa dọn dẹp các gói này.` : "Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?"} confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete.item)} />
  </div>;
}
