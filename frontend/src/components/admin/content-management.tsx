/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Eye, RotateCcw, Trash2 } from "lucide-react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  createArticle,
  createNewsCategory,
  createTestimonial,
  getAdminArticles,
  getAdminNewsCategories,
  getAdminTestimonials,
  restoreArticle,
  setNewsCategoryActive,
  setTestimonialActive,
  unpublishArticle,
  updateArticle,
  updateNewsCategory,
  updateTestimonial,
  type Article,
  type NewsCategory,
  type Testimonial,
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
    <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa bài viết" : "Soạn bài viết"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Select label="Danh mục" name="article-category" required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Chọn danh mục</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input label="Tiêu đề" name="article-title" required maxLength={250} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><Input label="Slug" name="article-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={280} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /><Input label="Tóm tắt" name="article-summary" maxLength={1000} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /><ImageUpload label="Thumbnail URL" hint="Khuyến nghị ảnh ngang 16:9. Để trống nếu bài không cần ảnh." value={form.thumbnailUrl} onChange={(url) => setForm({ ...form, thumbnailUrl: url })} />{form.thumbnailUrl && <div className="aspect-[16/9] overflow-hidden rounded-xl border border-line-200"><img src={form.thumbnailUrl} alt="Xem trước thumbnail" className="h-full w-full object-cover" /></div>}<Input label="Tác giả" name="article-author" maxLength={150} value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} /><div className="grid gap-2 text-sm font-medium"><label>Nội dung bài viết (Rich Text)</label><div className="font-normal"><RichTextEditor value={form.content} onChange={(value) => setForm({ ...form, content: value })} /></div></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Công bố ngay</label><div className="flex flex-wrap gap-2"><Button type="submit">{editing ? "Lưu bài viết" : "Tạo bài viết"}</Button><Button type="button" variant="secondary" onClick={() => setPreview(true)} disabled={!form.content.trim()}><Eye size={15} /> Xem trước</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card>
    <TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có bài viết"><DataTable caption="Danh sách bài viết"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Bài viết</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Cập nhật</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id} className={item.isDeleted ? "opacity-70" : undefined}><td className="px-4 py-3"><strong>{item.title}</strong><span className="block text-xs text-slate-600">{item.categoryName} · {item.slug}</span></td><td className="px-4 py-3"><Badge variant={item.isDeleted ? "danger" : item.isPublished ? "success" : "warning"}>{item.isDeleted ? "Đã tắt" : item.isPublished ? "Đã công bố" : "Bản nháp"}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{displayDate(item.updatedAt ?? item.createdAt)}</td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-2">{item.isDeleted ? <><Button variant="secondary" onClick={() => void restoreDeletedArticle(item)}><RotateCcw size={15} /> Khôi phục bản nháp</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></> : <><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isPublished ? <Button variant="secondary" onClick={() => void setPublished(item, false)}>Chuyển nháp</Button> : <Button variant="secondary" onClick={() => void setPublished(item, true)}>Công bố</Button>}<Button variant="danger" onClick={() => setPendingDelete(item)}>Tắt</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell>
  </div><ConfirmDialog open={pendingDelete !== null} title={`Tắt bài viết ${pendingDelete?.title ?? ""}?`} description="Bài viết sẽ bị soft delete và biến mất khỏi blog. Nội dung vẫn nằm trong DB; khôi phục sẽ đưa bài về bản nháp để biên tập viên kiểm tra trước khi công bố lại." confirmLabel="Tắt bài viết" destructive onClose={() => setPendingDelete(null)} onConfirm={() => pendingDelete && void softDeleteArticle(pendingDelete)} /><ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn bài viết ${pendingHardDelete?.title ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDeleteArticle(pendingHardDelete)} /><Modal open={preview} title={form.title || "Xem trước Markdown"} onClose={() => setPreview(false)}><MarkdownContent content={form.content} /></Modal></div>;
}

type TestimonialForm = { customerName: string; companyName: string; position: string; content: string; avatarUrl: string; logoUrl: string; rating: string; displayOrder: string };
const emptyTestimonial: TestimonialForm = { customerName: "", companyName: "", position: "", content: "", avatarUrl: "", logoUrl: "", rating: "5", displayOrder: "0" };

export function TestimonialsView() {
  const [data, setData] = useState<Page<Testimonial> | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyTestimonial);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [pendingDisable, setPendingDisable] = useState<Testimonial | null>(null);
  const [pendingHardDelete, setPendingHardDelete] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await getAdminTestimonials()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải đánh giá."); } finally { setLoading(false); } }, []);
  useEffect(() => {
    let active = true;
    getAdminTestimonials().then((result) => { if (active) { setData(result); setError(""); } }).catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải đánh giá."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  function edit(item: Testimonial) { setEditing(item); setForm({ customerName: item.customerName, companyName: item.companyName ?? "", position: item.position ?? "", content: item.content, avatarUrl: item.avatarUrl ?? "", logoUrl: item.logoUrl ?? "", rating: String(item.rating), displayOrder: String(item.displayOrder) }); }
  function reset() { setEditing(null); setForm(emptyTestimonial); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); try { const payload = { customerName: form.customerName.trim(), companyName: form.companyName.trim() || null, position: form.position.trim() || null, content: form.content.trim(), avatarUrl: form.avatarUrl.trim() || null, logoUrl: form.logoUrl.trim() || null, rating: Number(form.rating), displayOrder: Number(form.displayOrder) }; if (editing) await updateTestimonial(editing.id, payload); else await createTestimonial(payload); reset(); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể lưu đánh giá."); } }
  async function changeStatus(item: Testimonial, isActive: boolean) { try { await setTestimonialActive(item.id, isActive); setPendingDisable(null); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đổi trạng thái đánh giá."); } }

  async function hardDelete(item: Testimonial) {
    try {
      const response = await fetch(`/api/testimonials/${item.id}/hard`, { method: "DELETE" });
      if (!response.ok) throw new Error("Xóa vĩnh viễn thất bại. Lỗi HTTP " + response.status);
      setPendingHardDelete(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể xóa vĩnh viễn đánh giá."); }
  }

  return <div className="mx-auto max-w-7xl"><PageHeading title="Đánh giá khách hàng" description="Chỉ công bố nội dung đã được phép và xác minh; ẩn mềm giữ lịch sử và luôn có thể khôi phục." /><ErrorBox message={error} /><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
    <Card><h2 className="text-lg font-bold">{editing ? "Chỉnh sửa đánh giá" : "Thêm đánh giá"}</h2><form className="mt-5 grid gap-4" onSubmit={submit}><Input label="Khách hàng" name="testimonial-name" required maxLength={150} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /><Input label="Công ty" name="testimonial-company" maxLength={200} value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /><Input label="Vị trí" name="testimonial-position" maxLength={100} value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} /><ImageUpload label="Avatar URL" value={form.avatarUrl} onChange={(url) => setForm({ ...form, avatarUrl: url })} /><ImageUpload label="Logo URL" value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} /><div className="grid grid-cols-2 gap-3"><Select label="Điểm" name="testimonial-rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}</Select><Input label="Thứ tự" name="testimonial-order" type="number" min="0" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></div><TextArea label="Nội dung" required value={form.content} onChange={(value) => setForm({ ...form, content: value })} maxLength={1000} /><div className="flex gap-2"><Button type="submit">{editing ? "Lưu thay đổi" : "Thêm đánh giá"}</Button>{editing && <Button type="button" variant="secondary" onClick={reset}>Hủy</Button>}</div></form></Card>
    <TableShell loading={loading} error={!loading ? error : undefined} isEmpty={!loading && !error && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có đánh giá"><DataTable caption="Danh sách đánh giá"><thead className="bg-ice-100/70"><tr><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Đánh giá</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-line-200">{data?.items.map((item) => <tr key={item.id} className={!item.isActive ? "opacity-70" : undefined}><td className="px-4 py-3"><strong>{item.customerName}</strong><span className="block text-xs text-slate-600">{item.companyName ?? "-"}</span></td><td className="px-4 py-3">{item.rating}/5</td><td className="px-4 py-3"><Badge variant={item.isActive ? "success" : "danger"}>{item.isActive ? "Đã công bố" : "Đã ẩn"}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => edit(item)}>Sửa</Button>{item.isActive ? <Button variant="danger" onClick={() => setPendingDisable(item)}>Ẩn</Button> : <><Button variant="secondary" onClick={() => void changeStatus(item, true)}><RotateCcw size={15} /> Khôi phục</Button><Button variant="danger" onClick={() => setPendingHardDelete(item)}><Trash2 size={15} /> Xóa vĩnh viễn</Button></>}</div></td></tr>)}</tbody></DataTable></TableShell>
  </div><ConfirmDialog open={pendingDisable !== null} title={`Ẩn đánh giá của ${pendingDisable?.customerName ?? ""}?`} description="Đánh giá sẽ biến mất khỏi landing nhưng bản ghi vẫn được giữ để kiểm tra và khôi phục." confirmLabel="Ẩn đánh giá" destructive onClose={() => setPendingDisable(null)} onConfirm={() => pendingDisable && void changeStatus(pendingDisable, false)} /><ConfirmDialog open={pendingHardDelete !== null} title={`Xóa vĩnh viễn đánh giá của ${pendingHardDelete?.customerName ?? ""}?`} description="Hành động này sẽ xóa vật lý dữ liệu khỏi cơ sở dữ liệu và không thể hoàn tác. Bạn có chắc chắn không?" confirmLabel="Xóa vĩnh viễn" destructive onClose={() => setPendingHardDelete(null)} onConfirm={() => pendingHardDelete && void hardDelete(pendingHardDelete)} /></div>;
}
