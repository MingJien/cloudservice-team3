"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { getAdminNewsCategories, createNewsCategory, updateNewsCategory, deactivateNewsCategory, getAdminArticles, createArticle, updateArticle, unpublishArticle, getAdminTestimonials, createTestimonial, updateTestimonial, deactivateTestimonial, getContacts, updateContactStatus, replyToContact } from "@/features/content/api";
import type { Article, Contact, NewsCategory, Testimonial } from "@/features/content/api";
import { exportOrders, getOrders, updateOrderStatus } from "@/features/orders/api";
import type { OrderItem, OrderStatus } from "@/features/orders/api";
import { getAffiliates, updateAffiliateStatus } from "@/features/affiliates/api";
import type { Affiliate } from "@/features/affiliates/api";
import type { Page } from "@/features/catalog/types";
import { currentSession } from "@/features/auth/session-client";

type BadgeVariant = "success" | "danger" | "warning" | "info";

function statusVariant(status: string): BadgeVariant {
  if (["Done", "Replied"].includes(status)) return "success";
  if (status === "Rejected") return "danger";
  if (["Processing", "Read"].includes(status)) return "warning";
  return "info";
}

function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "-";
}

function ErrorBox({ message }: { message: string }) {
  return message ? <p className="mb-5 rounded-xl border border-danger-600/30 bg-danger-600/5 p-4 text-sm text-danger-600" role="alert">{message}</p> : null;
}

function TextArea({ label, value, onChange, required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; maxLength?: number }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<textarea required={required} maxLength={maxLength} className="min-h-32 rounded-xl border border-line-200 px-3 py-2 outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function pageQuery(pageNumber: number, pageSize = 20, search?: string, status?: string) {
  const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) });
  if (search?.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);
  return params.toString();
}

type CategoryForm = { name: string; slug: string; description: string };
const emptyCategory: CategoryForm = { name: "", slug: "", description: "" };

export function NewsCategoriesView() {
  const [data, setData] = useState<Page<NewsCategory> | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);
  const [editing, setEditing] = useState<NewsCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { setData(await getAdminNewsCategories()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải danh mục tin."); } finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    getAdminNewsCategories().then((result) => { if (active) { setData(result); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh mục tin."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: NewsCategory) { setEditing(item); setForm({ name: item.name, slug: item.slug, description: item.description ?? "" }); }
  function reset() { setEditing(null); setForm(emptyCategory); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { const payload = { name: form.name, slug: form.slug, description: form.description || null }; if (editing) await updateNewsCategory(editing.id, payload); else await createNewsCategory(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu danh mục tin."); }
  }
  async function deactivate(id: number) { try { await deactivateNewsCategory(id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể vô hiệu hóa danh mục tin."); } }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Danh mục tin" description="Quản lý taxonomy blog, slug public và trạng thái hiển thị." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Input label="Tên" name="news-category-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Slug" name="news-category-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><TextArea label="Mô tả" value={form.description} onChange={(value) => setForm({ ...form, description: value })} maxLength={500} /><div className="flex gap-2"><Button type="submit">{editing ? "Lưu thay đổi" : "Tạo danh mục"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card><TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có danh mục" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={() => undefined} /> : undefined}><DataTable caption="Danh mục blog"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Tên</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3 font-mono text-xs">{item.slug}</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Hoạt động" : "Đã tắt"}</Badge></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isActive && <Button variant="danger" onClick={() => void deactivate(item.id)}>Tắt</Button>}</div></td></tr>)}</tbody></DataTable></TableShell></div></div>;
}

type ArticleForm = { categoryId: string; title: string; slug: string; summary: string; content: string; thumbnailUrl: string; authorName: string; isPublished: boolean };
const emptyArticle: ArticleForm = { categoryId: "", title: "", slug: "", summary: "", content: "", thumbnailUrl: "", authorName: "", isPublished: true };

export function ArticlesView() {
  const [data, setData] = useState<Page<Article> | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [form, setForm] = useState<ArticleForm>(emptyArticle);
  const [editing, setEditing] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() { setLoading(true); setError(""); try { const [articles, categoryPage] = await Promise.all([getAdminArticles("pageNumber=1&pageSize=100"), getAdminNewsCategories()]); setData(articles); setCategories(categoryPage.items.filter((item) => item.isActive)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải bài viết."); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    Promise.all([getAdminArticles("pageNumber=1&pageSize=100"), getAdminNewsCategories()]).then(([articles, categoryPage]) => { if (active) { setData(articles); setCategories(categoryPage.items.filter((item) => item.isActive)); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải bài viết."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: Article) { setEditing(item); setForm({ categoryId: String(item.categoryId), title: item.title, slug: item.slug, summary: item.summary ?? "", content: item.content, thumbnailUrl: item.thumbnailUrl ?? "", authorName: item.authorName ?? "", isPublished: item.isPublished }); }
  function reset() { setEditing(null); setForm(emptyArticle); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const payload = { ...form, categoryId: Number(form.categoryId), summary: form.summary || null, thumbnailUrl: form.thumbnailUrl || null, authorName: form.authorName || null }; if (editing) await updateArticle(editing.id, payload); else await createArticle(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu bài viết."); } }
  async function unpublish(id: number) { try { await unpublishArticle(id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể gỡ bài viết."); } }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Tin tức / Blog" description="Soạn Markdown/text an toàn, chỉnh sửa được và publish/unpublish có audit log." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa bài viết" : "Soạn bài viết"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Select label="Danh mục" name="article-category" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Chọn danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input label="Tiêu đề" name="article-title" required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><Input label="Slug" name="article-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><Input label="Tóm tắt" name="article-summary" maxLength={1000} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /><Input label="Thumbnail URL" name="article-thumbnail" type="url" value={form.thumbnailUrl} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} /><Input label="Tác giả" name="article-author" value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} /><TextArea label="Nội dung Markdown" required value={form.content} onChange={(value) => setForm({ ...form, content: value })} maxLength={50000} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Công bố ngay</label><div className="flex gap-2"><Button type="submit">{editing ? "Lưu bài viết" : "Tạo bài viết"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card><TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có bài viết"><DataTable caption="Danh sách bài viết"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Bài viết</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id}><td className="px-4 py-3"><strong>{item.title}</strong><span className="block text-xs text-slate-600">{item.categoryName} · {item.slug}</span></td><td className="px-4 py-3"><Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Published" : "Draft"}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{displayDate(item.updatedAt ?? item.createdAt)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"> <Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isPublished && <Button variant="danger" onClick={() => void unpublish(item.id)}>Gỡ</Button>}</div></td></tr>)}</tbody></DataTable></TableShell></div></div>;
}

type TestimonialForm = { customerName: string; companyName: string; position: string; content: string; avatarUrl: string; logoUrl: string; rating: string; displayOrder: string };
const emptyTestimonial: TestimonialForm = { customerName: "", companyName: "", position: "", content: "", avatarUrl: "", logoUrl: "", rating: "5", displayOrder: "0" };

export function TestimonialsView() {
  const [data, setData] = useState<Page<Testimonial> | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyTestimonial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { setData(await getAdminTestimonials()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải testimonial."); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    getAdminTestimonials().then((result) => { if (active) { setData(result); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải testimonial."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: Testimonial) { setEditing(item); setForm({ customerName: item.customerName, companyName: item.companyName ?? "", position: item.position ?? "", content: item.content, avatarUrl: item.avatarUrl ?? "", logoUrl: item.logoUrl ?? "", rating: String(item.rating), displayOrder: String(item.displayOrder) }); }
  function reset() { setEditing(null); setForm(emptyTestimonial); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const payload = { customerName: form.customerName, companyName: form.companyName || null, position: form.position || null, content: form.content, avatarUrl: form.avatarUrl || null, logoUrl: form.logoUrl || null, rating: Number(form.rating), displayOrder: Number(form.displayOrder) }; if (editing) await updateTestimonial(editing.id, payload); else await createTestimonial(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu testimonial."); } }
  async function deactivate(id: number) { try { await deactivateTestimonial(id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể ẩn testimonial."); } }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Đánh giá khách hàng" description="Chỉ hiển thị nội dung được nhóm xác minh; có thể chỉnh sửa và ẩn mềm để giữ lịch sử." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa đánh giá" : "Thêm đánh giá"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Input label="Khách hàng" name="testimonial-name" required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /><Input label="Công ty" name="testimonial-company" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /><Input label="Vị trí" name="testimonial-position" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} /><Input label="Avatar URL" name="testimonial-avatar" type="url" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} /><Input label="Logo URL" name="testimonial-logo" type="url" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} /><div className="grid grid-cols-2 gap-3"><Select label="Điểm" name="testimonial-rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}><option value="5">5 / 5</option><option value="4">4 / 5</option><option value="3">3 / 5</option><option value="2">2 / 5</option><option value="1">1 / 5</option></Select><Input label="Thứ tự" name="testimonial-order" type="number" min="0" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></div><TextArea label="Nội dung" required value={form.content} onChange={(value) => setForm({ ...form, content: value })} maxLength={1000} /><div className="flex gap-2"><Button type="submit">{editing ? "Lưu thay đổi" : "Thêm đánh giá"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card><TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có testimonial"><DataTable caption="Danh sách testimonial"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Đánh giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id}><td className="px-4 py-3"><strong>{item.customerName}</strong><span className="block text-xs text-slate-600">{item.companyName ?? "-"}</span></td><td className="px-4 py-3">{item.rating}/5</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Published" : "Hidden"}</Badge></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isActive && <Button variant="danger" onClick={() => void deactivate(item.id)}>Ẩn</Button>}</div></td></tr>)}</tbody></DataTable></TableShell></div></div>;
}

function StatusModal({ open, title, note, setNote, onClose, onSubmit, requiredNote = false }: { open: boolean; title: string; note: string; setNote: (value: string) => void; onClose: () => void; onSubmit: () => void; requiredNote?: boolean }) {
  return <Modal open={open} title={title} onClose={onClose}><div className="grid gap-4"><TextArea label={requiredNote ? "Lý do từ chối (bắt buộc)" : "Ghi chú nội bộ (tuỳ chọn)"} required={requiredNote} value={note} onChange={setNote} maxLength={2000} /><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="button" onClick={onSubmit} disabled={requiredNote && !note.trim()}>Xác nhận</Button></div></div></Modal>;
}

export function OrdersView() {
  const [data, setData] = useState<Page<OrderItem> | null>(null);
  const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ id: number; status: OrderStatus; label: string; rowVersion?: string } | null>(null); const [note, setNote] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [canExport, setCanExport] = useState(false);
  async function load() { setLoading(true); setError(""); try { setData(await getOrders(pageQuery(page, 20, search, status))); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải đơn."); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    getOrders(pageQuery(page, 20, search, status)).then((result) => { if (active) { setData(result); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải đơn."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);
  useEffect(() => {
    let active = true;
    currentSession().then((session) => { if (active) setCanExport(session.user.role === "Admin"); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  function applyFilters(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearch(searchInput); }
  async function submitStatus() { if (!target) return; if (target.status === "Rejected" && !note.trim()) { setError("Phải nhập lý do khi từ chối yêu cầu."); return; } const rowVersion = target.rowVersion ?? data?.items.find((item) => item.id === target.id)?.rowVersion; if (!rowVersion) { setError("Không tìm thấy phiên bản dữ liệu của đơn. Hãy tải lại danh sách."); return; } try { await updateOrderStatus(target.id, { status: target.status, internalNote: note.trim() || null, rowVersion }); setTarget(null); setNote(""); await load(); } catch (caught) { setTarget(null); setError(caught instanceof Error ? `${caught.message} Danh sách đã được tải lại.` : "Không thể cập nhật trạng thái."); await load(); } }
  async function download() { try { const blob = await exportOrders(pageQuery(1, 100, search, status)); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "order-requests.xlsx"; link.click(); URL.revokeObjectURL(url); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xuất danh sách."); } }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Yêu cầu đặt dịch vụ" description="Nhận xử lý nghĩa là nhân viên đã tiếp nhận; Hoàn tất là đã xử lý xong; Từ chối là trạng thái kết thúc và bắt buộc ghi lý do. Mọi chuyển trạng thái đều có audit." action={canExport ? <Button variant="secondary" onClick={() => void download()}>Xuất Excel (.xlsx)</Button> : undefined} /><div className="mb-5 rounded-2xl border border-line-200 bg-white p-4"><form className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={applyFilters}><Input label="Tìm theo mã, tên hoặc email" name="order-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><Select label="Trạng thái" name="order-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Tất cả</option><option value="New">Mới</option><option value="Processing">Đang xử lý</option><option value="Done">Hoàn tất</option><option value="Rejected">Từ chối</option></Select><Button type="submit" variant="secondary">Áp dụng</Button></form></div><ErrorBox message={error} /><TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Không có yêu cầu phù hợp" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}><DataTable caption="Yêu cầu đặt dịch vụ"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Ước tính</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id}><td className="px-4 py-3"><strong>{item.customerName}</strong><span className="block text-xs text-slate-600">{item.email} · {item.trackingCode}</span></td><td className="px-4 py-3 text-sm">#{item.servicePlanId} · {item.planName} · {item.billingCycle}</td><td className="px-4 py-3 text-sm font-semibold">{item.estimatedAmount.toLocaleString("vi-VN")} {item.currency}</td><td className="px-4 py-3"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td><td className="px-4 py-3"><div className="flex flex-wrap gap-2">{item.status === "New" && <><Button onClick={() => setTarget({ id: item.id, status: "Processing", label: "Tiếp nhận yêu cầu" })}>Nhận xử lý</Button><Button variant="danger" onClick={() => setTarget({ id: item.id, status: "Rejected", label: "Từ chối yêu cầu mới" })}>Từ chối</Button></>}{item.status === "Processing" && <><Button onClick={() => setTarget({ id: item.id, status: "Done", label: "Hoàn tất yêu cầu" })}>Hoàn tất</Button><Button variant="danger" onClick={() => setTarget({ id: item.id, status: "Rejected", label: "Từ chối yêu cầu" })}>Từ chối</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell><StatusModal open={Boolean(target)} title={target?.label ?? "Cập nhật yêu cầu"} note={note} setNote={setNote} requiredNote={target?.status === "Rejected"} onClose={() => { setTarget(null); setNote(""); }} onSubmit={() => void submitStatus()} /></div>;
}

export function AffiliatesView() {
  const [data, setData] = useState<Page<Affiliate> | null>(null); const [searchInput, setSearchInput] = useState(""); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1); const [target, setTarget] = useState<{ id: number; status: Affiliate["status"]; label: string } | null>(null); const [note, setNote] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  async function load() { setLoading(true); setError(""); try { setData(await getAffiliates(pageQuery(page, 20, search, status))); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải affiliate."); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    getAffiliates(pageQuery(page, 20, search, status)).then((result) => { if (active) { setData(result); setError(""); } }).catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải affiliate."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);
  function applyFilters(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearch(searchInput); }
  async function submitStatus() { if (!target) return; try { await updateAffiliateStatus(target.id, { status: target.status, internalNote: note || null }); setTarget(null); setNote(""); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể cập nhật affiliate."); } }
  return <div className="mx-auto max-w-7xl"><PageHeading title="Đăng ký Affiliate" description="Duyệt hồ sơ đối tác theo quy trình, có lọc và ghi chú nội bộ." /><div className="mb-5 rounded-2xl border border-line-200 bg-white p-4"><form className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={applyFilters}><Input label="Tìm theo tên, email hoặc kênh" name="affiliate-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><Select label="Trạng thái" name="affiliate-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Tất cả</option><option value="New">Mới</option><option value="Processing">Đang xử lý</option><option value="Done">Đã duyệt</option><option value="Rejected">Từ chối</option></Select><Button type="submit" variant="secondary">Áp dụng</Button></form></div><ErrorBox message={error} /><TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có hồ sơ phù hợp" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}><DataTable caption="Hồ sơ affiliate"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Hồ sơ</th><th className="px-4 py-3">Kênh</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id}><td className="px-4 py-3"><strong>{item.fullName}</strong><span className="block text-xs text-slate-600">{item.email} · {item.phone}</span></td><td className="px-4 py-3 text-sm">{item.websiteOrChannel ?? "-"}</td><td className="px-4 py-3"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">{item.status === "New" && <Button onClick={() => setTarget({ id: item.id, status: "Processing", label: "Tiếp nhận hồ sơ affiliate" })}>Xử lý</Button>}{item.status === "Processing" && <><Button onClick={() => setTarget({ id: item.id, status: "Done", label: "Duyệt hồ sơ affiliate" })}>Duyệt</Button><Button variant="danger" onClick={() => setTarget({ id: item.id, status: "Rejected", label: "Từ chối hồ sơ affiliate" })}>Từ chối</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell><StatusModal open={Boolean(target)} title={target?.label ?? "Cập nhật hồ sơ"} note={note} setNote={setNote} onClose={() => { setTarget(null); setNote(""); }} onSubmit={() => void submitStatus()} /></div>;
}

export function ContactsView() {
  const [data, setData] = useState<Page<Contact> | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState<Contact | null>(null);
  const [reply, setReply] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await getContacts(pageQuery(page, 20, search, status)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải liên hệ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getContacts(pageQuery(page, 20, search, status))
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Không thể tải liên hệ.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [page, search, status]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  async function setStatusFor(id: number, nextStatus: Contact["status"]) {
    try {
      await updateContactStatus(id, { status: nextStatus });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật liên hệ.");
    }
  }

  function openReply(item: Contact) {
    setReplyTarget(item);
    setReply(item.adminReply ?? "");
    setError("");
  }

  async function sendReply() {
    if (!replyTarget || reply.trim().length < 2) return;
    setSubmittingReply(true);
    try {
      await replyToContact(replyTarget.id, { reply: reply.trim() });
      setReplyTarget(null);
      setReply("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi phản hồi.");
    } finally {
      setSubmittingReply(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading title="Liên hệ khách hàng" description="Tiếp nhận, phân loại và trả lời từng yêu cầu. Câu trả lời sẽ hiển thị cho khách qua mã liên hệ riêng." />
      <div className="mb-5 rounded-2xl border border-line-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={applyFilters}>
          <Input label="Tìm theo tên, email hoặc chủ đề" name="contact-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
          <Select label="Trạng thái" name="contact-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
            <option value="">Tất cả</option>
            <option value="New">Mới</option>
            <option value="Read">Đang xử lý</option>
            <option value="Replied">Đã phản hồi</option>
          </Select>
          <Button type="submit" variant="secondary">Áp dụng</Button>
        </form>
      </div>
      <ErrorBox message={error} />
      <TableShell
        loading={loading}
        error={!loading ? error : undefined}
        isEmpty={!loading && !error && (data?.items.length ?? 0) === 0}
        emptyTitle="Chưa có liên hệ phù hợp"
        footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}
      >
        <DataTable caption="Yêu cầu liên hệ">
          <thead className="bg-ice-100/70">
            <tr>
              <th className="px-4 py-3">Người gửi</th>
              <th className="px-4 py-3">Yêu cầu</th>
              <th className="px-4 py-3">Phản hồi</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-200">
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 align-top">
                  <strong>{item.fullName}</strong>
                  <span className="block text-xs text-slate-600">{item.email}{item.phone ? ` · ${item.phone}` : ""}</span>
                  <span className="mt-1 block font-mono text-[11px] text-slate-500">{item.trackingCode}</span>
                </td>
                <td className="max-w-sm px-4 py-3 align-top text-sm">
                  <strong className="block text-ink-950 dark:text-white">{item.subject}</strong>
                  <span className="mt-1 block whitespace-pre-wrap text-slate-600">{item.message}</span>
                  <span className="mt-2 block text-xs text-slate-500">{displayDate(item.createdAt)}</span>
                </td>
                <td className="max-w-sm px-4 py-3 align-top text-sm text-slate-600">
                  {item.adminReply ? <span className="whitespace-pre-wrap">{item.adminReply}</span> : <span className="italic text-slate-400">Chưa có phản hồi</span>}
                  {item.repliedAt && <span className="mt-2 block text-xs text-slate-500">{displayDate(item.repliedAt)}</span>}
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge variant={statusVariant(item.status)}>
                    {item.status === "New" ? "Mới" : item.status === "Read" ? "Đang xử lý" : "Đã phản hồi"}
                  </Badge>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex min-w-32 flex-col gap-2">
                    {item.status === "New" && <Button variant="secondary" onClick={() => void setStatusFor(item.id, "Read")}>Nhận xử lý</Button>}
                    <Button onClick={() => openReply(item)}>{item.status === "Replied" ? "Sửa phản hồi" : "Phản hồi"}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </TableShell>

      <Modal open={Boolean(replyTarget)} title={replyTarget ? `Phản hồi: ${replyTarget.subject}` : "Phản hồi khách hàng"} onClose={() => { setReplyTarget(null); setReply(""); }}>
        <div className="grid gap-4">
          <p className="rounded-xl bg-ice-100 p-3 text-sm leading-6 text-slate-600 dark:bg-white/5">
            Nội dung này được gửi công khai cho đúng khách hàng thông qua mã liên hệ. Không ghi mật khẩu, token hoặc thông tin nội bộ.
          </p>
          <TextArea label="Nội dung phản hồi cho khách hàng" required value={reply} onChange={setReply} maxLength={3000} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setReplyTarget(null); setReply(""); }}>Hủy</Button>
            <Button type="button" isLoading={submittingReply} disabled={reply.trim().length < 2} onClick={() => void sendReply()}>Gửi phản hồi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
