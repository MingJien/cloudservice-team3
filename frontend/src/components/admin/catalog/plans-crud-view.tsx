"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, QrCode, RotateCcw, Trash2 } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { createPlan, generatePlanQr, getAdminCategories, getAdminPlans, restorePlan, setPlanActive, updatePlan, uploadPlanImage } from "@/features/catalog/api";
import type { Category, Plan } from "@/features/catalog/types";
import { apiAssetUrl } from "@/lib/api-client";
import { FormError, toNumberOrNull } from "./catalog-shared";

type PlanForm = { categoryId: string; name: string; slug: string; shortDescription: string; description: string; cpuCores: string; ramGb: string; storageGb: string; storageType: string; bandwidthGb: string; specificationsJson: string; imageUrl: string; featuredLabel: string; isFeatured: boolean; displayOrder: string };
const emptyPlan: PlanForm = { categoryId: "", name: "", slug: "", shortDescription: "", description: "", cpuCores: "", ramGb: "", storageGb: "", storageType: "", bandwidthGb: "", specificationsJson: "", imageUrl: "", featuredLabel: "", isFeatured: false, displayOrder: "0" };
type QrResult = { servicePlanId: number; targetUrl: string; dataUrl: string; generatedAt?: string };

function displayImageUrl(url: string) {
  if (!url) return "";
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  return apiAssetUrl(url) ?? url;
}

export function PlansCrudView() {
  const [items, setItems] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [pendingDisable, setPendingDisable] = useState<Plan | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<Plan | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "deleted">("active");
  const [qr, setQr] = useState<QrResult | null>(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [plans, categoryPage] = await Promise.all([getAdminPlans(), getAdminCategories()]);
      setItems(plans.items); setCategories(categoryPage.items); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải gói dịch vụ."); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([getAdminPlans(), getAdminCategories()]).then(([plans, categoryPage]) => { if (active) { setItems(plans.items); setCategories(categoryPage.items); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải gói dịch vụ."); });
    return () => { active = false; };
  }, []);

  function reset() {
    setEditing(null); setForm(emptyPlan); setSelectedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function edit(item: Plan) {
    let imageUrl = ""; let featuredLabel = "";
    try {
      const spec = JSON.parse(item.specificationsJson || "{}") as Record<string, unknown>;
      imageUrl = typeof spec.imageUrl === "string" ? spec.imageUrl : "";
      featuredLabel = typeof spec.featuredLabel === "string" ? spec.featuredLabel : "";
    } catch { /* Legacy malformed JSON remains editable. */ }
    setEditing(item); setSelectedImage(null);
    setForm({ categoryId: String(item.categoryId), name: item.name, slug: item.slug, shortDescription: item.shortDescription ?? "", description: item.description ?? "", cpuCores: item.cpuCores ? String(item.cpuCores) : "", ramGb: item.ramGb ? String(item.ramGb) : "", storageGb: item.storageGb ? String(item.storageGb) : "", storageType: item.storageType ?? "", bandwidthGb: item.bandwidthGb ? String(item.bandwidthGb) : "", specificationsJson: item.specificationsJson ?? "", imageUrl, featuredLabel, isFeatured: item.isFeatured, displayOrder: String(item.displayOrder) });
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) { setError("Ảnh gói chỉ hỗ trợ JPG, PNG, GIF hoặc WEBP."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Dung lượng ảnh gói tối đa là 5 MB."); return; }
    setSelectedImage(file); setError("");
  }

  function parseSpecifications(): Record<string, unknown> {
    if (!form.specificationsJson.trim()) return {};
    const parsed: unknown = JSON.parse(form.specificationsJson);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error('Specifications JSON phải là object, ví dụ {"os":"Linux"}.');
    return { ...(parsed as Record<string, unknown>) };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const spec = parseSpecifications();
      let imageUrl = form.imageUrl.trim();
      if (selectedImage) imageUrl = (await uploadPlanImage(selectedImage)).imageUrl;
      if (imageUrl) spec.imageUrl = imageUrl; else delete spec.imageUrl;
      if (form.featuredLabel.trim()) spec.featuredLabel = form.featuredLabel.trim(); else delete spec.featuredLabel;
      const payload = { categoryId: Number(form.categoryId), name: form.name.trim(), slug: form.slug.trim(), shortDescription: form.shortDescription.trim() || null, description: form.description.trim() || null, cpuCores: toNumberOrNull(form.cpuCores), ramGb: toNumberOrNull(form.ramGb), storageGb: toNumberOrNull(form.storageGb), storageType: form.storageType.trim() || null, bandwidthGb: toNumberOrNull(form.bandwidthGb), specificationsJson: Object.keys(spec).length ? JSON.stringify(spec) : null, isFeatured: form.isFeatured, displayOrder: Number(form.displayOrder) };
      if (editing) await updatePlan(editing.id, payload); else await createPlan(payload);
      reset(); await load();
    } catch (caught) {
      setError(caught instanceof SyntaxError ? "Specifications JSON sai cú pháp; kiểm tra dấu ngoặc và dấu nháy kép." : caught instanceof Error ? caught.message : "Không thể lưu gói dịch vụ.");
    } finally { setBusy(false); }
  }

  async function changeStatus(item: Plan, isActive: boolean) {
    setBusy(true); setError("");
    try { if (isActive) await restorePlan(item.id); else await setPlanActive(item.id, false); setPendingDisable(null); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái gói."); }
    finally { setBusy(false); }
  }

  async function hardDelete(item: Plan) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/service-plans/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn gói dịch vụ. Hãy chắc chắn gói không có đơn hàng hoặc mức giá."); }
    finally { setBusy(false); }
  }

  async function createQr(item: Plan) {
    setBusy(true); setError("");
    try { setQr(await generatePlanQr(item.id)); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể sinh QR."); }
    finally { setBusy(false); }
  }

  const visibleItems = items.filter((item) => statusFilter === "active" ? item.isActive && !item.isDeleted : item.isDeleted || !item.isActive);

  return <div className="mx-auto max-w-7xl animate-[sr-kf-fadeUp_0.6s_forwards]">
    <PageHeading title="Gói dịch vụ" description="Gói lưu cấu hình và nội dung; giá được quản lý riêng ở Bảng giá để có chu kỳ và lịch sử hiệu lực. QR động dẫn thẳng tới form đặt hàng đúng gói." />
    <FormError message={error} />
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
      <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa gói" : "Thêm gói"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}>
        <Select label="Danh mục" name="plan-category" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Chọn danh mục đang hoạt động</option>{categories.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        <Input label="Tên gói" name="plan-name" required maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Slug" name="plan-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
        <Input label="Mô tả ngắn" name="plan-short-description" maxLength={500} value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} />
        <Input label="Mô tả đầy đủ" name="plan-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <div className="grid grid-cols-2 gap-3"><Input label="CPU core" name="plan-cpu" type="number" min="1" max="256" value={form.cpuCores} onChange={(event) => setForm({ ...form, cpuCores: event.target.value })} /><Input label="RAM GB" name="plan-ram" type="number" min="0.01" max="4096" step="0.01" value={form.ramGb} onChange={(event) => setForm({ ...form, ramGb: event.target.value })} /><Input label="Lưu trữ GB" name="plan-storage" type="number" min="1" value={form.storageGb} onChange={(event) => setForm({ ...form, storageGb: event.target.value })} /><Input label="Băng thông GB" name="plan-bandwidth" type="number" min="1" value={form.bandwidthGb} onChange={(event) => setForm({ ...form, bandwidthGb: event.target.value })} /></div>
        <Input label="Loại lưu trữ" name="plan-storage-type" maxLength={30} placeholder="NVMe SSD" value={form.storageType} onChange={(event) => setForm({ ...form, storageType: event.target.value })} />
        <div className="grid gap-2"><span className="text-sm font-medium">Ảnh minh họa (tùy chọn)</span><label className="flex min-h-24 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-200 px-4 py-3 transition hover:border-river-500 dark:border-white/15"><input ref={imageInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={selectImage} /><span className="grid h-10 w-10 place-items-center rounded-xl bg-river-600/10 text-river-700"><ImagePlus size={20} /></span><span><strong className="block text-sm">{selectedImage?.name ?? "Chọn ảnh từ máy tính"}</strong><span className="text-xs text-slate-500">JPG, PNG, GIF, WEBP · tối đa 5 MB</span></span></label><Input name="plan-image-url" placeholder="Hoặc nhập URL ảnh" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} disabled={selectedImage !== null} /></div>
        {form.imageUrl && !selectedImage && <div className="relative h-40 overflow-hidden rounded-xl border border-line-200"><Image src={displayImageUrl(form.imageUrl)} alt="Xem trước ảnh gói" fill sizes="35vw" unoptimized className="object-contain p-2" /><button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute right-2 top-2 rounded-lg bg-white p-2 text-danger-600 shadow" aria-label="Xóa ảnh"><Trash2 size={15} /></button></div>}
        <Input label="Nhãn nổi bật" name="plan-featured-label" maxLength={80} value={form.featuredLabel} onChange={(event) => setForm({ ...form, featuredLabel: event.target.value })} hint="Ví dụ: Được chọn nhiều; không dùng tuyên bố chưa kiểm chứng." />
        <Input label="Specifications JSON (nâng cao)" name="plan-specifications" value={form.specificationsJson} onChange={(event) => setForm({ ...form, specificationsJson: event.target.value })} hint={'Object JSON hợp lệ, ví dụ {"os":"Linux","backup":"Hàng ngày"}.'} />
        <Input label="Thứ tự" name="plan-order" type="number" min="0" required value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> Hiển thị nổi bật</label>
        <div className="flex gap-2"><Button type="submit" isLoading={busy}>{editing ? "Lưu thay đổi" : "Tạo gói"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div>
      </form></Card>
      <div className="grid content-start gap-3"><Select label="Trạng thái" name="plan-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "active" | "deleted")}><option value="active">Đang hoạt động</option><option value="deleted">Đã tắt</option></Select><TableShell isEmpty={visibleItems.length === 0} emptyTitle={statusFilter === "active" ? "Chưa có gói hoạt động" : "Chưa có gói đã tắt"}><DataTable caption="Gói dịch vụ"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Cấu hình</th><th className="px-4 py-3">Bảng giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{visibleItems.map((item) => <tr key={item.id} className={!item.isActive ? "opacity-70" : undefined}><td className="px-4 py-3"><strong className="text-river-700 dark:text-cyan-300">{item.name}</strong><span className="block text-xs text-slate-500">#{item.id} · {item.categoryName} · {item.slug}</span></td><td className="px-4 py-3 text-xs">{item.cpuCores ?? "-"} core · {item.ramGb ?? "-"} GB · {item.storageGb ?? "-"} GB</td><td className="px-4 py-3 text-xs">{item.prices.filter((price) => price.isActive && !price.isDeleted).length} bật / {item.prices.filter((price) => !price.isDeleted).length} tổng</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Hoạt động" : "Đã tắt"}</Badge></td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2">{item.isActive ? <><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button><Button variant="secondary" onClick={() => void createQr(item)}><QrCode size={15} /> QR</Button><Button variant="danger" onClick={() => setPendingDisable(item)}>Tắt</Button></> : <><Button variant="secondary" onClick={() => void changeStatus(item, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell></div>
    </div>
    <ConfirmDialog open={pendingDisable !== null} title={`Tắt gói ${pendingDisable?.name ?? ""}?`} description={`Gói sẽ biến mất khỏi landing, báo giá và form đặt hàng. ${pendingDisable?.prices.filter((price) => price.isActive).length ?? 0} mức giá đang bật vẫn được giữ để khôi phục sau.`} confirmLabel="Tắt gói" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable, false)} />
    <ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn gói ${pendingHardDelete?.name ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete)} />
    <Modal open={qr !== null} title="QR đặt hàng động" onClose={() => { setQr(null); setCopiedQr(false); }}>{qr && <div className="grid gap-5 sm:grid-cols-[180px_1fr]"><div className="rounded-2xl border border-line-200 bg-white p-3"><Image src={qr.dataUrl} alt={`QR mở ${qr.targetUrl}`} width={180} height={180} unoptimized className="h-auto w-full" /></div><div><p className="text-sm font-semibold">Đích QR</p><a href={qr.targetUrl} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm text-river-700 hover:underline">{qr.targetUrl}</a><p className="mt-4 text-xs leading-5 text-slate-500">Ảnh được sinh trực tiếp trong RAM, không tạo file rác trên server. Quét QR sẽ mở form đặt hàng và khóa đúng gói #{qr.servicePlanId}.</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => { navigator.clipboard.writeText(qr.targetUrl); setCopiedQr(true); setTimeout(() => setCopiedQr(false), 2000); }} className="inline-flex min-h-10 items-center rounded-xl border border-line-200 bg-ice-100/70 px-4 text-sm font-semibold text-river-700 transition-colors hover:bg-ice-100 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300">{copiedQr ? "✓ Đã sao chép" : "Sao chép link"}</button><a href={apiAssetUrl(`/api/serviceplans/${qr.servicePlanId}/qr`) ?? "#"} download={`cloudservice-plan-${qr.servicePlanId}.png`} className="inline-flex min-h-10 items-center rounded-xl bg-river-600 px-4 text-sm font-semibold text-white">Tải QR PNG</a></div></div></div>}</Modal>
  </div>;
}
