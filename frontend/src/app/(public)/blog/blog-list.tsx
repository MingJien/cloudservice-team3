"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BookOpen, CalendarDays, Clock3, Newspaper, Search, Sparkles } from "lucide-react";
import { getArticles, getNewsCategories, type Article, type NewsCategory } from "@/features/content/api";
import type { Page } from "@/features/catalog/types";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ArticleVisual, estimateArticleReadingTime, formatArticleDate } from "@/components/content/article-visual";

const emptyPage: Page<Article> = { items: [], pageNumber: 1, pageSize: 9, totalCount: 0, totalPages: 0 };

export function BlogList() {
  const [data, setData] = useState<Page<Article>>(emptyPage);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [loadedQuery, setLoadedQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getNewsCategories().then((page) => setCategories(page.items)).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let current = true;
    const queryKey = `${pageNumber}|${search}|${categorySlug}`;
    const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: "9" });
    if (search) params.set("search", search);
    if (categorySlug) params.set("categorySlug", categorySlug);
    getArticles(params.toString())
      .then((page) => { if (current) { setData(page); setError(""); setLoadedQuery(queryKey); } })
      .catch((caught: unknown) => { if (current) { setError(caught instanceof Error ? caught.message : "Không thể tải bài viết."); setLoadedQuery(queryKey); } });
    return () => { current = false; };
  }, [pageNumber, search, categorySlug]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageNumber(1);
    setSearch(draftSearch.trim());
  }

  const [featured, ...remaining] = data.items;
  const loading = loadedQuery !== `${pageNumber}|${search}|${categorySlug}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f4fbff_0%,#ffffff_28%,#f7fbfe_100%)] pb-20 text-[#07101f] dark:bg-[linear-gradient(180deg,#07101f_0%,#091528_34%,#07101f_100%)] dark:text-white">
      <section className="relative border-b border-[#dbeaf3] pb-12 pt-14 dark:border-white/[0.06] md:pb-16 md:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(34,211,238,.16),transparent_28%),linear-gradient(rgba(8,115,184,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(8,115,184,.045)_1px,transparent_1px)] bg-[size:auto,44px_44px,44px_44px] dark:opacity-60" />
        <Container className="relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c7e3f3] bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] dark:border-cyan-300/15 dark:bg-white/[0.05] dark:text-cyan-300"><Newspaper size={14} /> Nhật ký kỹ thuật MekongNode</span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.05em] sm:text-5xl">Ghi lại quyết định kỹ thuật, <span className="bg-[linear-gradient(100deg,#066aa9,#00a9cc)] bg-clip-text text-transparent dark:bg-[linear-gradient(100deg,#67e8f9,#93c5fd)] dark:bg-clip-text">không viết bài cho đủ mục.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">Bài viết được quản lý từ CMS, tìm kiếm và phân trang tại backend. Nội dung tập trung vào cách nhóm giải quyết giá, đơn hàng, bảo mật và vận hành Cloud/VPS.</p>
          </div>

          <form onSubmit={submitSearch} className="mt-9 flex max-w-2xl gap-2 rounded-2xl border border-[#cbe1ee] bg-white/90 p-2 shadow-[0_18px_45px_-34px_rgba(7,64,103,.7)] dark:border-white/10 dark:bg-white/[0.055]">
            <label htmlFor="blog-search" className="sr-only">Tìm bài viết</label>
            <Search className="ml-2 mt-3 shrink-0 text-slate-400" size={18} />
            <input id="blog-search" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Ví dụ: Clean Architecture, JWT, affiliate..." className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-sm font-medium outline-none placeholder:text-slate-400" />
            <Button type="submit" className="shrink-0 px-5">Tìm bài</Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2" aria-label="Lọc theo chủ đề">
            <button type="button" onClick={() => { setCategorySlug(""); setPageNumber(1); }} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${!categorySlug ? "border-[#0873b8] bg-[#0873b8] text-white shadow-[0_8px_20px_-13px_rgba(8,115,184,.9)]" : "border-[#cfe1ec] bg-white/70 text-slate-600 hover:border-[#8dc5e1] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>Tất cả chủ đề</button>
            {categories.map((category) => <button key={category.id} type="button" onClick={() => { setCategorySlug(category.slug); setPageNumber(1); }} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${categorySlug === category.slug ? "border-[#0873b8] bg-[#0873b8] text-white" : "border-[#cfe1ec] bg-white/70 text-slate-600 hover:border-[#8dc5e1] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"}`}>{category.name} <span className="opacity-60">{category.publishedArticleCount}</span></button>)}
          </div>
        </Container>
      </section>

      <Container className="pt-12 md:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0873b8] dark:text-cyan-300">Bài viết mới</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{search ? `Kết quả cho “${search}”` : categorySlug ? "Nội dung theo chủ đề" : "Từ phòng lab đến sản phẩm"}</h2></div>
          {!loading && !error && <p className="text-sm text-slate-500 dark:text-slate-400">{data.totalCount} bài · dữ liệu từ API</p>}
        </div>

        {error && <div className="mt-8 rounded-2xl border border-rose-300 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-300/20 dark:bg-rose-300/5 dark:text-rose-200">{error}</div>}

        {loading ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-3" aria-live="polite" aria-label="Đang tải bài viết">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-[1.5rem] border border-[#dbeaf2] bg-white/70 dark:border-white/[0.07] dark:bg-white/[0.035]" />)}</div>
        ) : featured ? (
          <>
            <Link href={`/blog/${featured.slug}`} className="group mt-8 grid overflow-hidden rounded-[1.7rem] border border-[#cbe1ed] bg-white shadow-[0_30px_75px_-48px_rgba(7,64,103,.72)] transition-all duration-300 hover:-translate-y-1 hover:border-[#83c4e2] dark:border-white/10 dark:bg-[#0d1b32] dark:hover:border-cyan-300/30 lg:grid-cols-[1.1fr_.9fr]">
              <div className="relative min-h-72 overflow-hidden lg:min-h-[25rem]"><ArticleVisual article={featured} priority /><div className="absolute inset-0 bg-gradient-to-t from-[#061126]/55 to-transparent lg:hidden" /><span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#071426]/72 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-cyan-200 backdrop-blur-xl"><Sparkles size={13} /> Bài mới nổi bật</span></div>
              <article className="flex flex-col justify-center p-7 sm:p-9 lg:p-11">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] dark:text-cyan-300">{featured.categoryName}</p>
                <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">{featured.title}</h3>
                <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{featured.summary ?? featured.content.slice(0, 220)}</p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{formatArticleDate(featured.publishedAt ?? featured.createdAt)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{estimateArticleReadingTime(featured)} phút đọc</span><span>{featured.authorName ?? "Nhóm MekongNode"}</span></div>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#0873b8] dark:text-cyan-300">Đọc bài phân tích <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
              </article>
            </Link>

            {remaining.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{remaining.map((article) => <Link key={article.id} href={`/blog/${article.slug}`} className="group flex min-h-full flex-col overflow-hidden rounded-[1.45rem] border border-[#d4e5ef] bg-white shadow-[0_20px_50px_-42px_rgba(7,64,103,.7)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8ec8e4] dark:border-white/[0.09] dark:bg-[#0d1b32] dark:hover:border-cyan-300/25"><div className="relative h-48 overflow-hidden"><ArticleVisual article={article} /><span className="absolute left-4 top-4 rounded-full border border-white/15 bg-[#071426]/72 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-cyan-200 backdrop-blur-xl">{article.categoryName}</span></div><article className="flex flex-1 flex-col p-6"><h3 className="text-xl font-bold leading-snug tracking-[-0.025em]">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.summary ?? article.content.slice(0, 145)}</p><div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-slate-500 dark:text-slate-400"><span>{formatArticleDate(article.publishedAt ?? article.createdAt)}</span><span>{estimateArticleReadingTime(article)} phút đọc</span></div></article></Link>)}</div>}

            <div className="mt-10"><Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={(page) => { setPageNumber(page); window.scrollTo({ top: 420, behavior: "smooth" }); }} /></div>
          </>
        ) : !error && (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#bfd9e8] bg-white/70 px-6 py-16 text-center dark:border-white/10 dark:bg-white/[0.03]"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf7fd] text-[#0873b8] dark:bg-cyan-300/10 dark:text-cyan-300"><BookOpen size={24} /></span><h3 className="mt-4 text-lg font-bold">Chưa có bài viết phù hợp</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Thử bỏ từ khóa hoặc chọn một chủ đề khác.</p></div>
        )}
      </Container>
    </main>
  );
}
