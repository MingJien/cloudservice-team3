import Image from "next/image";
import { BookOpen } from "lucide-react";
import type { Article } from "@/features/content/api";
import { apiAssetUrl } from "@/lib/api-client";

export function formatArticleDate(value: string | null) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value ?? Date.now()));
}

export function estimateArticleReadingTime(article: Article) {
  const words = `${article.summary ?? ""} ${article.content}`.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 220));
}

export function ArticleVisual({ article, priority = false }: { article: Article; priority?: boolean }) {
  const src = apiAssetUrl(article.thumbnailUrl);

  if (src) {
    return (
      <Image
        unoptimized
        src={src}
        alt={`Ảnh minh họa bài viết: ${article.title}`}
        fill
        priority={priority}
        sizes={priority ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#071a30,#0b4164_58%,#087aa3)]">
      <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.065)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.065)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom_right,black,transparent)]" />
      <div className="relative grid h-full place-items-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/10 text-cyan-200 shadow-2xl backdrop-blur-xl">
          <BookOpen size={28} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
