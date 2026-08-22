import { ArticleDetail } from "./article-detail";
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <ArticleDetail slug={slug} />; }
