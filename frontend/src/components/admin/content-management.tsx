/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, RotateCcw, Search, ShieldCheck, Star, TimerReset, Trash2 } from "lucide-react";
import { MarkdownContent } from "@/components/content/markdown-content";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  createArticle,
  createNewsCategory,
  getAdminArticles,
  getAdminNewsCategories,
  getAdminTestimonials,
  restoreArticle,
  setNewsCategoryActive,
  setTestimonialActive,
  unpublishArticle,
  updateArticle,
  updateNewsCategory,
  type Article,
  type NewsCategory,
  type Testimonial,
  type TestimonialModerationStatus,
} from "@/features/content/api";
import type { Page } from "@/features/catalog/types";

function ErrorBox({ message }: { message: string }) { return message ? <p className="mb-5 rounded-xl border border-danger-600/30 bg-danger-600/5 p-4 text-sm text-danger-600" role="alert">{message}</p> : null; }
function TextArea({ label, value, onChange, required = false, maxLength, hint }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; maxLength?: number; hint?: string }) { return <label className="grid gap-2 text-sm font-medium">{label}<textarea required={required} maxLength={maxLength} className="min-h-32 rounded-xl border border-line-200 bg-white px-3 py-2 outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15 dark:border-white/10 dark:bg-white/5" value={value} onChange={(event) => onChange(event.target.value)} />{hint && <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span>}</label>; }
function displayDate(value: string | null) { return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "-"; }

type CategoryForm = { name: string; slug: string; description: string };
const emptyCategory: CategoryForm = { name: "", slug: "", description: "" };

export function NewsCategoriesView() {
  const [data, setData] = useState<Page<NewsCategory> | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategory);
  const [editing, setEditing] = useState<NewsCategory | null>(null);
  const [pendingDisable, setPendingDisable] = useState<NewsCategory | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<NewsCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await getAdminNewsCategories()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải danh mục tin."); } finally { setLoading(false); } }, []);
  useEffect(() => {
    let active = true;
    getAdminNewsCategories().then((result) => { if (active) { setData(result); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh mục tin."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: NewsCategory) { setEditing(item); setForm({ name: item.name, slug: item.slug, description: item.description ?? "" }); }
  function reset() { setEditing(null); setForm(emptyCategory); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const payload = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null }; if (editing) await updateNewsCategory(editing.id, payload); else await createNewsCategory(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu danh mục tin."); } }
  async function changeStatus(item: NewsCategory, isActive: boolean) { try { await setNewsCategoryActive(item.id, isActive); setPendingDisable(null); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái danh mục tin."); } }

  async function hardDelete(item: NewsCategory) {
    try {
      const response = await fetch(`/api/news-categories/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn danh mục tin. Hãy kiểm tra các bài viết bên trong."); }
  }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Danh mục tin" description="Tắt danh mục chỉ ẩn các bài đã công bố khỏi blog; bài viết và lịch sử vẫn còn trong DB và có thể khôi phục." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
    <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Input label="Tên" name="news-category-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input label="Slug" name="news-category-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={150} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><TextArea label="Mô tả" value={form.description} onChange={(value) => setForm({ ...form, description: value })} maxLength={500} /><div className="flex gap-2"><Button type="submit">{editing ? "Lưu thay đổi" : "Tạo danh mục"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card>
    <TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có danh mục"><DataTable caption="Danh mục blog"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Tên</th><th className="px-4 py-3">Bài viết</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id} className={!item.isActive ? "opacity-70" : undefined}><td className="px-4 py-3"><strong>{item.name}</strong><span className="block font-mono text-xs text-slate-500">{item.slug}</span></td><td className="px-4 py-3 text-sm"><strong>{item.publishedArticleCount}</strong> công bố / {item.totalArticleCount} tổng</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Hoạt động" : "Đã tắt"}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isActive ? <Button variant="danger" onClick={() => setPendingDisable(item)}>Tắt</Button> : <><Button variant="secondary" onClick={() => void changeStatus(item, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell>
  </div><ConfirmDialog open={pendingDisable !== null} title={`Tắt danh mục ${pendingDisable?.name ?? ""}?`} description={`${pendingDisable?.publishedArticleCount ?? 0} bài đang công bố trong danh mục sẽ tạm ẩn khỏi blog. Nội dung bài không bị xóa hoặc chuyển thành bản nháp.`} confirmLabel="Tắt danh mục" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable, false)} /><ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn danh mục ${pendingHardDelete?.name ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete)} /></div>;
}

type ArticleForm = { categoryId: string; title: string; slug: string; summary: string; content: string; thumbnailUrl: string; authorName: string; isPublished: boolean };
const emptyArticle: ArticleForm = { categoryId: "", title: "", slug: "", summary: "", content: "", thumbnailUrl: "", authorName: "", isPublished: true };

export function ArticlesView() {
  const [data, setData] = useState<Page<Article> | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [form, setForm] = useState<ArticleForm>(emptyArticle);
  const [editing, setEditing] = useState<Article | null>(null);
  const [preview, setPreview] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Article | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => { setLoading(true); setError(""); try { const [articles, categoryPage] = await Promise.all([getAdminArticles("pageNumber=1&pageSize=100"), getAdminNewsCategories()]); setData(articles); setCategories(categoryPage.items.filter((item) => item.isActive)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải bài viết."); } finally { setLoading(false); } }, []);
  useEffect(() => {
    let active = true;
    Promise.all([getAdminArticles("pageNumber=1&pageSize=100"), getAdminNewsCategories()]).then(([articles, categoryPage]) => { if (active) { setData(articles); setCategories(categoryPage.items.filter((item) => item.isActive)); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải bài viết."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: Article) { setEditing(item); setForm({ categoryId: String(item.categoryId), title: item.title, slug: item.slug, summary: item.summary ?? "", content: item.content, thumbnailUrl: item.thumbnailUrl ?? "", authorName: item.authorName ?? "", isPublished: item.isPublished }); }
  function reset() { setEditing(null); setForm(emptyArticle); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const payload = { ...form, title: form.title.trim(), slug: form.slug.trim(), content: form.content.trim(), categoryId: Number(form.categoryId), summary: form.summary.trim() || null, thumbnailUrl: form.thumbnailUrl.trim() || null, authorName: form.authorName.trim() || null }; if (editing) await updateArticle(editing.id, payload); else await createArticle(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu bài viết."); } }
  async function setPublished(item: Article, isPublished: boolean) { try { await updateArticle(item.id, { categoryId: item.categoryId, title: item.title, slug: item.slug, summary: item.summary, content: item.content, thumbnailUrl: item.thumbnailUrl, authorName: item.authorName, isPublished }); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái bài viết."); } }
  async function softDeleteArticle(item: Article) { try { await unpublishArticle(item.id); setPendingDelete(null); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tắt bài viết."); } }
  async function restoreDeletedArticle(item: Article) { try { await restoreArticle(item.id); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể khôi phục bài viết."); } }

  async function hardDeleteArticle(item: Article) {
    try {
      const response = await fetch(`/api/news-articles/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn bài viết."); }
  }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Tin tức / Blog" description="Thumbnail là ảnh đại diện ở danh sách/đầu bài. Markdown là cú pháp định dạng nội dung và được renderer an toàn chuyển thành tiêu đề, danh sách, link, code." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
    <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa bài viết" : "Soạn bài viết"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Select label="Danh mục" name="article-category" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Chọn danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input label="Tiêu đề" name="article-title" required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><Input label="Slug" name="article-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={280} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><Input label="Tóm tắt" name="article-summary" maxLength={1000} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /><ImageUpload label="Thumbnail URL" hint="Khuyến nghị ảnh ngang 16:9. Để trống nếu bài không cần ảnh." value={form.thumbnailUrl} onChange={(url) => setForm({ ...form, thumbnailUrl: url })} />{form.thumbnailUrl && <div className="aspect-[16/9] overflow-hidden rounded-xl border border-line-200"><img src={form.thumbnailUrl} alt="Xem trước thumbnail" className="h-full w-full object-cover" /></div>}<Input label="Tác giả" name="article-author" maxLength={150} value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} /><div className="grid gap-2 text-sm font-medium"><label>Nội dung bài viết (Markdown an toàn)</label><p className="text-xs font-normal leading-5 text-slate-500 dark:text-slate-400">Thanh công cụ chèn đúng cú pháp mà trang Blog hỗ trợ; xem trước trước khi công bố.</p><div className="font-normal"><MarkdownEditor value={form.content} onChange={(value) => setForm({ ...form, content: value })} /></div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Công bố ngay</label><div className="flex flex-wrap gap-2"><Button type="submit">{editing ? "Lưu bài viết" : "Tạo bài viết"}</Button><Button type="button" variant="secondary" onClick={() => setPreview(true)} disabled={!form.content.trim()}><Eye size={15} /> Xem trước</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card>
    <TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có bài viết"><DataTable caption="Danh sách bài viết"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Bài viết</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id} className={item.isDeleted ? "opacity-70" : undefined}><td className="px-4 py-3"><strong>{item.title}</strong><span className="block text-xs text-slate-600">{item.categoryName} · {item.slug}</span></td><td className="px-4 py-3"><Badge variant={item.isDeleted ? "danger" : item.isPublished ? "success" : "warning"}>{item.isDeleted ? "Đã tắt" : item.isPublished ? "Đã công bố" : "Bản nháp"}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{displayDate(item.updatedAt ?? item.createdAt)}</td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2">{item.isDeleted ? <><Button variant="secondary" onClick={() => void restoreDeletedArticle(item)}><RotateCcw size={15} /> Khôi phục bản nháp</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></> : <><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isPublished ? <Button variant="secondary" onClick={() => void setPublished(item, false)}>Chuyển nháp</Button> : <Button variant="secondary" onClick={() => void setPublished(item, true)}>Công bố</Button>}<Button variant="danger" onClick={() => setPendingDelete(item)}>Tắt</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell>
  </div><ConfirmDialog open={pendingDelete !== null} title={`Tắt bài viết ${pendingDelete?.title ?? ""}?`} description="Bài viết sẽ bị soft delete và biến mất khỏi blog. Nội dung vẫn nằm trong DB; khôi phục sẽ đưa bài về bản nháp để biên tập viên kiểm tra trước khi công bố lại." confirmLabel="Tắt bài viết" destructive onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && void softDeleteArticle(pendingDelete)} /><ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn bài viết ${pendingHardDelete?.title ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDeleteArticle(pendingHardDelete)} /><Modal open={preview} title={form.title || "Xem trước Markdown"} onClose={() => setPreview(false)}><MarkdownContent content={form.content} /></Modal></div>;
}

type TestimonialFilter = "All" | TestimonialModerationStatus;

const moderationMeta: Record<TestimonialModerationStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  Pending: { label: "Chờ duyệt", variant: "warning" },
  Published: { label: "Đã công bố", variant: "success" },
  Hidden: { label: "Đã ẩn", variant: "danger" },
};

export function TestimonialsView() {
  const [data, setData] = useState<Page<Testimonial> | null>(null);
  const [filter, setFilter] = useState<TestimonialFilter>("All");
  const [search, setSearch] = useState("");
  const [pendingApproval, setPendingApproval] = useState<Testimonial | null>(null);
  const [pendingHide, setPendingHide] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await getAdminTestimonials()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải đánh giá."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAdminTestimonials()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Không thể tải đánh giá.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function changeStatus(item: Testimonial, isActive: boolean) {
    try {
      await setTestimonialActive(item.id, isActive);
      setPendingApproval(null);
      setPendingHide(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật trạng thái kiểm duyệt.");
    }
  }

  const items = data?.items ?? [];
  const normalizedSearch = search.trim().toLocaleLowerCase("vi");
  const filteredItems = items.filter((item) => {
    if (filter !== "All" && item.moderationStatus !== filter) return false;
    if (!normalizedSearch) return true;
    return [item.customerName, item.content, item.orderReference, item.servicePlanName, item.serviceCategoryName]
      .some((value) => value?.toLocaleLowerCase("vi").includes(normalizedSearch));
  });
  const count = (status: TestimonialModerationStatus) => items.filter((item) => item.moderationStatus === status).length;

  return <div className="mx-auto max-w-7xl">
    <PageHeading title="Kiểm duyệt đánh giá" description="Duyệt hoặc ẩn phản hồi do khách gửi từ đơn hoàn tất. Nội dung và số sao là bằng chứng gốc nên quản trị viên không thể tự tạo hay chỉnh sửa." />
    <ErrorBox message={error} />

    <section className="mb-6 overflow-hidden rounded-2xl border border-[#b9d9ea] bg-[linear-gradient(125deg,#eef9ff,#ffffff)] p-5 shadow-[0_20px_55px_-42px_rgba(7,95,157,.75)] dark:border-cyan-300/15 dark:bg-[linear-gradient(125deg,rgba(14,116,144,.12),rgba(255,255,255,.025))]" aria-label="Nguyên tắc kiểm duyệt">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#075f9d] text-white"><ShieldCheck size={21} /></span>
        <div><h2 className="font-bold">Nguồn đánh giá được khóa theo đơn hàng</h2><p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">Khách gửi phản hồi tại trang theo dõi đơn sau trạng thái Hoàn tất. Admin chỉ quyết định công bố hoặc ẩn; mọi quyết định đều đi qua audit log.</p></div>
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-3" aria-label="Thống kê kiểm duyệt">
      {[
        { label: "Chờ duyệt", value: count("Pending"), icon: TimerReset, tone: "text-amber-600 bg-amber-500/10" },
        { label: "Đã công bố", value: count("Published"), icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-500/10" },
        { label: "Đã ẩn", value: count("Hidden"), icon: EyeOff, tone: "text-rose-600 bg-rose-500/10" },
      ].map((stat) => <article key={stat.label} className="flex items-center gap-4 rounded-2xl border border-line-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]"><span className={`grid size-11 place-items-center rounded-xl ${stat.tone}`}><stat.icon size={20} /></span><div><span className="text-xs font-semibold text-slate-500">{stat.label}</span><strong className="block text-2xl tabular-nums">{stat.value}</strong></div></article>)}
    </section>

    <section className="mt-6 rounded-2xl border border-line-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc trạng thái đánh giá">
          {(["All", "Pending", "Published", "Hidden"] as TestimonialFilter[]).map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`min-h-10 rounded-xl px-3.5 text-sm font-semibold transition ${filter === status ? "bg-[#075f9d] text-white shadow-sm" : "border border-line-200 bg-white text-slate-600 hover:border-[#9bc8e2] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>{status === "All" ? `Tất cả (${items.length})` : `${moderationMeta[status].label} (${count(status)})`}</button>)}
        </div>
        <label className="relative block w-full lg:max-w-sm"><span className="sr-only">Tìm đánh giá</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách, đơn, gói hoặc nội dung..." className="min-h-11 w-full rounded-xl border border-line-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-river-600 focus:ring-4 focus:ring-river-600/10 dark:border-white/10 dark:bg-[#071426]" /></label>
      </div>
    </section>

    <div className="mt-5">
      <TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && filteredItems.length === 0} emptyTitle="Không có đánh giá phù hợp">
        <div className="grid gap-4 p-4 sm:p-5">
          {filteredItems.map((item) => {
            const status = moderationMeta[item.moderationStatus];
            return <article key={item.id} className="rounded-2xl border border-line-200 bg-white p-5 shadow-[0_16px_38px_-34px_rgba(7,64,103,.65)] dark:border-white/[0.08] dark:bg-white/[0.025]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.customerName}</h3><Badge variant={status.variant}>{status.label}</Badge>{item.isVerifiedOrder ? <Badge variant="info"><ShieldCheck size={12} className="mr-1" /> Đơn xác minh</Badge> : <Badge variant="danger">Dữ liệu cũ không đủ nguồn</Badge>}</div><p className="mt-1 text-xs text-slate-500">Gửi lúc {displayDate(item.createdAt)}{item.companyName ? ` · ${item.companyName}` : ""}</p></div>
                <div className="flex items-center gap-1 text-amber-500" aria-label={`${item.rating} trên 5 sao`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={17} fill={index < item.rating ? "currentColor" : "none"} className={index < item.rating ? "" : "text-slate-300 dark:text-slate-600"} />)}<strong className="ml-1 text-sm text-slate-700 dark:text-slate-200">{item.rating}/5</strong></div>
              </div>
              <blockquote className="mt-4 rounded-xl bg-[#f4f9fc] px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">“{item.content}”</blockquote>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">{item.orderReference && <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold dark:bg-white/[0.06]">{item.orderReference}</span>}{item.serviceCategoryName && <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/[0.06]">{item.serviceCategoryName}</span>}{item.servicePlanName && <span className="rounded-full bg-slate-100 px-3 py-1.5 dark:bg-white/[0.06]">{item.servicePlanName}</span>}</div>
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line-200 pt-4 dark:border-white/[0.07]">
                {item.moderationStatus !== "Published" && item.isVerifiedOrder && <Button onClick={() => setPendingApproval(item)}><CheckCircle2 size={16} /> Duyệt công bố</Button>}
                {item.moderationStatus !== "Hidden" && <Button variant="danger" onClick={() => setPendingHide(item)}><EyeOff size={16} /> Ẩn đánh giá</Button>}
                {item.moderationStatus === "Hidden" && !item.isVerifiedOrder && <span className="self-center text-xs font-semibold text-slate-500">Bản ghi legacy chỉ được lưu để kiểm toán.</span>}
              </div>
            </article>;
          })}
        </div>
      </TableShell>
    </div>

    <ConfirmDialog open={pendingApproval !== null} title={`Công bố đánh giá của ${pendingApproval?.customerName ?? ""}?`} description="Đánh giá sẽ xuất hiện công khai đúng nguyên văn và số sao khách đã gửi. Hành động được lưu vào nhật ký kiểm toán." confirmLabel="Duyệt công bố" onClose={() => setPendingApproval(null)} onConfirm={() => pendingApproval && void changeStatus(pendingApproval, true)} />
    <ConfirmDialog open={pendingHide !== null} title={`Ẩn đánh giá của ${pendingHide?.customerName ?? ""}?`} description="Đánh giá sẽ biến mất khỏi trang công khai nhưng vẫn được giữ nguyên trong cơ sở dữ liệu và audit log." confirmLabel="Ẩn đánh giá" destructive onClose={() => setPendingHide(null)} onConfirm={() => pendingHide && void changeStatus(pendingHide, false)} />
  </div>;
}
