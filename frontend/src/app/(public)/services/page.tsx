"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { getPlans } from "@/features/catalog/api";
import type { Plan } from "@/features/catalog/types";

function ServicesContent() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");

  useEffect(() => {
    getPlans("pageNumber=1&pageSize=100")
      .then((page) => setPlans(page.items))
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Không thể tải catalog."));
  }, []);

  const filtered = plans.filter((plan) => {
    const matchesSearch = `${plan.name} ${plan.categoryName} ${plan.shortDescription ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter
      ? plan.categoryName.toLowerCase().includes(categoryFilter.toLowerCase())
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container>
      <PageHeading
        title={categoryFilter ? `Dịch vụ ${categoryFilter.toUpperCase()}` : "Dịch vụ cloud"}
        description="Catalog public lấy dữ liệu từ API, cấu hình minh bạch, tự động triển khai."
      />
      <div className="mb-8 max-w-xl">
        <Input
          label="Tìm dịch vụ"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ví dụ: VPS, hosting..."
        />
      </div>
      {error ? (
        <ErrorState description={error} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan) => (
            <Card key={plan.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="info">{plan.categoryName}</Badge>
                  <h2 className="mt-3 text-xl font-bold">{plan.name}</h2>
                </div>
                {plan.isFeatured && <Badge variant="success">Nổi bật</Badge>}
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {plan.shortDescription}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-ice-100 dark:bg-ink-900 p-3 border border-line-100 dark:border-white/5">
                  <strong className="block text-sm dark:text-white">{plan.cpuCores ?? "-"}</strong>CPU
                </div>
                <div className="rounded-xl bg-ice-100 dark:bg-ink-900 p-3 border border-line-100 dark:border-white/5">
                  <strong className="block text-sm dark:text-white">{plan.ramGb ?? "-"}</strong>RAM GB
                </div>
                <div className="rounded-xl bg-ice-100 dark:bg-ink-900 p-3 border border-line-100 dark:border-white/5">
                  <strong className="block text-sm dark:text-white">{plan.storageGb ?? "-"}</strong>SSD GB
                </div>
              </div>
              <Link
                className="mt-6 font-semibold text-river-700 dark:text-accent-cyan hover:underline"
                href={`/services/${plan.slug}`}
              >
                Xem cấu hình và đặt dịch vụ →
              </Link>
            </Card>
          ))}
        </div>
      )}
      {!error && filtered.length === 0 && (
        <Card className="text-center text-slate-600 dark:text-slate-400 p-12">
          Chưa có gói phù hợp với bộ lọc.
        </Card>
      )}
    </Container>
  );
}

export default function ServicesPage() {
  return (
    <main className="py-12 md:py-16">
      <Suspense fallback={<Container><p className="py-12 text-center text-slate-500">Đang tải...</p></Container>}>
        <ServicesContent />
      </Suspense>
    </main>
  );
}
