"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getArticles } from "@/features/content/api";
import type { Article } from "@/features/content/api";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export function BlogList() { const [items, setItems] = useState<Article[]>([]); const [search, setSearch] = useState(""); const [error, setError] = useState(""); useEffect(() => { getArticles("pageNumber=1&pageSize=50").then((page) => setItems(page.items)).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Không thể tải blog.")); }, []); const filtered = items.filter((item) => `${item.title} ${item.summary ?? ""}`.toLowerCase().includes(search.toLowerCase())); return <main className="py-12 md:py-16"><Container><PageHeading title="Blog kỹ thuật" description="Hướng dẫn vận hành, kiến thức cloud và thông báo dịch vụ được quản trị qua CMS." /><div className="mb-8 max-w-xl"><Input label="Tìm bài viết" name="search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>{error && <Card className="text-danger-600">{error}</Card>}<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((article) => <Link key={article.id} href={`/blog/${article.slug}`}><Card className="h-full transition hover:border-river-600"><Badge variant="info">{article.categoryName}</Badge><h2 className="mt-4 text-xl font-bold">{article.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{article.summary ?? article.content.slice(0, 150)}</p><p className="mt-5 text-xs text-slate-600">{article.authorName ?? "MekongNode"} · {article.viewCount} lượt đọc</p></Card></Link>)}</div>{!error && filtered.length === 0 && <Card className="text-center text-slate-600">Chưa có bài viết công khai.</Card>}</Container></main>; }
