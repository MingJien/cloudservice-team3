/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getArticle, type Article } from "@/features/content/api";
import { Container } from "@/components/layout/container";
import { MarkdownContent } from "@/components/content/markdown-content";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ArticleDetail({ slug }: { slug: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getArticle(slug).then(setArticle).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Không thể tải bài viết.")); }, [slug]);
  if (error) return <main className="py-16"><Container><Card className="text-danger-600">{error}</Card></Container></main>;
  if (!article) return <main className="py-16"><Container><p role="status" className="text-slate-600">Đang tải bài viết...</p></Container></main>;

  return <main className="py-12 md:py-16"><Container><article className="mx-auto max-w-3xl">
    <Badge variant="info">{article.categoryName}</Badge>
    <h1 className="mt-4 text-4xl font-bold leading-tight">{article.title}</h1>
    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{article.authorName ?? "MekongNode"} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("vi-VN") : "Bản nháp"} · {article.viewCount} lượt đọc</p>
    {article.thumbnailUrl && <div className="mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-line-200 dark:border-white/10"><img src={article.thumbnailUrl} alt={`Ảnh đại diện bài viết ${article.title}`} className="h-full w-full object-cover" /></div>}
    {article.summary && <p className="mt-8 rounded-2xl border-l-4 border-river-600 bg-ice-100 px-5 py-4 text-base font-medium leading-7 dark:bg-white/5">{article.summary}</p>}
    <MarkdownContent content={article.content} className="mt-8" />
    <Link className="mt-10 inline-flex font-semibold text-river-700 hover:underline dark:text-cyan-300" href="/blog">← Quay lại blog</Link>
  </article></Container></main>;
}
