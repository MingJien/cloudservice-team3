"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { getPlan } from "@/features/catalog/api";
import type { Plan } from "@/features/catalog/types";
import { BillingCycleBadge } from "@/features/pricing/billing-cycle";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { apiAssetUrl } from "@/lib/api-client";

const money = (value: number, currency: string) => new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

function displayImageUrl(url: string) {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  return apiAssetUrl(url) ?? url;
}

export function ServiceDetail({ slug }: { slug: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { getPlan(slug).then(setPlan).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Không thể tải gói dịch vụ.")); }, [slug]);

  if (error) return <main className="py-16"><Container><ErrorState description={error} /></Container></main>;
  if (!plan) return <main className="py-16"><Container><p role="status" className="text-slate-600">Đang tải cấu hình...</p></Container></main>;

  let specs: Record<string, string> = {};
  try { specs = plan.specificationsJson ? JSON.parse(plan.specificationsJson) as Record<string, string> : {}; } catch { specs = {}; }
  const imageUrl = specs.imageUrl;
  const featuredLabel = specs.featuredLabel;
  const displaySpecs = { ...specs };
  delete displaySpecs.imageUrl;
  delete displaySpecs.featuredLabel;
  const qrUrl = apiAssetUrl(plan.qrCodePath ?? `/api/service-plans/${plan.id}/qr-code`);
  const canOrder = plan.prices.length > 0;

  function copyOrderLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/order?planId=${plan?.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return <main className="py-12 md:py-16"><Container><div className="grid gap-8 lg:grid-cols-[1fr_0.72fr]">
    <div>
      <div className="flex items-center gap-3"><Badge variant="info">{plan.categoryName}</Badge>{featuredLabel && <Badge variant="success">{featuredLabel}</Badge>}</div>
      <h1 className="mt-4 text-4xl font-bold">{plan.name}</h1>
      {imageUrl && <div className="relative mt-6 h-48 overflow-hidden rounded-2xl border border-line-200 bg-white/50 sm:h-64 lg:h-80 dark:bg-black/50"><Image src={displayImageUrl(imageUrl)} alt={plan.name} fill sizes="(max-width: 1024px) 100vw, 58vw" unoptimized className="object-contain" /></div>}
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">{plan.description ?? plan.shortDescription}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2"><Card><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cấu hình chính</p><dl className="mt-4 grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt>CPU</dt><dd className="font-semibold">{plan.cpuCores ? `${plan.cpuCores} core` : "Theo gói"}</dd></div><div className="flex justify-between gap-4"><dt>RAM</dt><dd className="font-semibold">{plan.ramGb ? `${plan.ramGb} GB` : "Theo gói"}</dd></div><div className="flex justify-between gap-4"><dt>Lưu trữ</dt><dd className="font-semibold">{plan.storageGb ? `${plan.storageGb} GB ${plan.storageType ?? ""}` : "Theo gói"}</dd></div><div className="flex justify-between gap-4"><dt>Băng thông</dt><dd className="font-semibold">{plan.bandwidthGb ? `${plan.bandwidthGb} GB` : "Theo gói"}</dd></div></dl></Card>{Object.keys(displaySpecs).length > 0 && <Card><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Thông số bổ sung</p><dl className="mt-4 grid gap-3 text-sm">{Object.entries(displaySpecs).map(([key, value]) => <div key={key} className="flex justify-between gap-4"><dt className="text-slate-600 dark:text-slate-300">{key}</dt><dd className="text-right font-semibold">{String(value)}</dd></div>)}</dl></Card>}</div>
    </div>
    <div className="grid h-fit gap-4">
      <Card><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Bảng giá đang hiệu lực</p><div className="mt-5 grid gap-3">{plan.prices.map((price) => <div key={price.id} className="rounded-xl border border-line-200 p-4 dark:border-white/10"><div className="flex items-center justify-between gap-3"><BillingCycleBadge cycle={price.billingCycle} /><span className="text-lg font-bold text-river-700 dark:text-cyan-300">{money(price.effectivePrice, price.currency)}</span></div>{price.salePrice !== null && <p className="mt-2 text-right text-xs text-slate-600 line-through">{money(price.originalPrice, price.currency)}</p>}</div>)}{!canOrder && <div className="rounded-xl border border-warning-600/30 bg-warning-600/5 p-4"><p className="font-semibold text-warning-600">Gói chưa được mở bán</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Chưa có mức giá đang hoạt động trong khoảng hiệu lực hiện tại.</p></div>}</div><Button className="mt-6 w-full" disabled={!canOrder} onClick={() => { window.location.href = `/order?planId=${plan.id}`; }}>{canOrder ? "Đặt gói này" : "Chưa thể đặt hàng"}</Button><Link className="mt-4 block text-center text-sm font-semibold text-river-700 hover:underline dark:text-cyan-300" href="/contact">Cần tư vấn trước khi đặt?</Link></Card>
      {qrUrl && <Card><div className="flex items-center gap-2"><QrCode size={18} className="text-river-700 dark:text-cyan-300" /><p className="font-semibold">QR truy cập & đặt hàng nhanh</p></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Image src={qrUrl} alt={`QR mở trang ${plan.name}`} width={116} height={116} unoptimized className="shrink-0 rounded-xl border border-line-200 bg-white p-2" /><div className="text-xs leading-5 text-slate-600 dark:text-slate-300"><p>Quét bằng điện thoại để mở form đặt hàng khóa đúng gói <strong>{plan.name}</strong>.</p><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" onClick={copyOrderLink} className="inline-flex items-center gap-1.5 rounded-lg border border-line-200 bg-ice-100/70 px-2.5 py-1.5 font-medium text-river-700 transition-colors hover:bg-ice-100 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300 dark:hover:bg-white/10">{copied ? "✓ Đã sao chép link" : "Sao chép link đặt hàng"}</button><a href={`/order?planId=${plan.id}`} className="inline-flex items-center text-river-700 hover:underline dark:text-cyan-300">Mở link thử →</a></div></div></div></Card>}
    </div>
  </div></Container></main>;
}
