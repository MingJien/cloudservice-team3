"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { ZeroNumberInput } from "@/components/ui/zero-number-input";
import { DataTable, TableShell } from "@/components/ui/table-shell";
import { compareServicePlans } from "./api";
import type { ComparedPlan, PlanComparisonResponse } from "./types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function display(value: string | number | null, suffix = "") {
  return value === null ? "-" : `${value}${suffix}`;
}

export function PlanComparison() {
  const [ids, setIds] = useState("0");
  const [result, setResult] = useState<PlanComparisonResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parts = ids.split(",").map((value) => value.trim()).filter(Boolean);
    const parsed = parts.map(Number);
    if (parsed.length < 1 || parsed.length > 3 || parsed.some((value) => !Number.isInteger(value) || value <= 0) || new Set(parsed).size !== parsed.length) {
      setError("Nhập từ 1 đến 3 mã gói khác nhau, phân tách bằng dấu phẩy.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setResult(await compareServicePlans(parsed));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Không thể so sánh gói lúc này.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <form className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end" onSubmit={submit}>
          <ZeroNumberInput type="text" label="Mã gói cần so sánh" name="planIds" value={ids} onValueChange={setIds} placeholder="Ví dụ: 1,2,3" hint="Tối đa 3 gói; dữ liệu cấu hình và giá lấy trực tiếp từ API." />
          <Button className="md:min-w-40" type="submit" isLoading={loading}>So sánh</Button>
        </form>
      </Card>
      {error && <ErrorState title="Không thể so sánh" description={error} />}
      <TableShell loading={loading} isEmpty={!loading && !error && !result} emptyTitle="Nhập mã gói để bắt đầu so sánh">
        {result && <ComparisonTable plans={result.plans} />}
      </TableShell>
    </div>
  );
}

function ComparisonTable({ plans }: { plans: ComparedPlan[] }) {
  const rows = [
    ["Nhóm dịch vụ", (plan: ComparedPlan) => plan.categoryName],
    ["CPU", (plan: ComparedPlan) => display(plan.cpuCores, " vCPU")],
    ["RAM", (plan: ComparedPlan) => display(plan.ramGb, " GB")],
    ["Lưu trữ", (plan: ComparedPlan) => plan.storageGb === null ? "-" : `${plan.storageGb} GB ${plan.storageType ?? ""}`.trim()],
    ["Băng thông", (plan: ComparedPlan) => display(plan.bandwidthGb, " GB")],
  ] as const;

  return (
    <DataTable caption="So sánh cấu hình và giá các gói dịch vụ">
      <thead className="bg-ice-100/70"><tr><th className="px-5 py-4 font-semibold">Tiêu chí</th>{plans.map((plan) => <th key={plan.id} className="min-w-52 px-5 py-4"><span className="block font-semibold">{plan.name}</span><span className="mt-1 block text-xs font-normal text-slate-600">#{plan.id}</span></th>)}</tr></thead>
      <tbody className="divide-y divide-line-200">
        {rows.map(([label, read]) => <tr key={label}><th className="px-5 py-4 font-medium text-slate-600">{label}</th>{plans.map((plan) => <td key={plan.id} className="px-5 py-4 font-medium">{read(plan)}</td>)}</tr>)}
        <tr><th className="px-5 py-4 align-top font-medium text-slate-600">Giá hiệu lực</th>{plans.map((plan) => <td key={plan.id} className="px-5 py-4 align-top">{plan.prices.length === 0 ? "-" : <ul className="grid gap-2">{plan.prices.map((price) => <li key={price.planPriceId}><span className="block text-xs text-slate-600">{price.billingCycle}</span><strong className="text-river-700">{money(price.effectivePrice, price.currency)}</strong></li>)}</ul>}</td>)}</tr>
      </tbody>
    </DataTable>
  );
}
