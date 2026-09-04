"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { getDashboard } from "@/features/dashboard/api";
import type { Dashboard } from "@/features/dashboard/api";

const numberFormat = new Intl.NumberFormat("vi-VN");

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `${month}/${year.slice(-2)}`;
}

function BarChart({ data }: { data: Dashboard["ordersByMonth"] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const chartWidth = 760;
  const chartHeight = 240;
  const left = 42;
  const bottom = 34;
  const top = 16;
  const usableWidth = chartWidth - left - 12;
  const usableHeight = chartHeight - top - bottom;
  const slot = usableWidth / Math.max(data.length, 1);
  const barWidth = Math.max(14, slot * 0.58);

  return (
    <div className="overflow-x-auto">
      <svg className="h-64 min-w-[620px] w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Biểu đồ số yêu cầu đặt dịch vụ theo tháng">
        <defs>
          <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = top + usableHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={left} x2={chartWidth - 12} y1={y} y2={y} stroke="#D7E0E8" strokeDasharray="4 5" className="dark:stroke-white/10" />
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#5E6B7A" className="dark:fill-slate-400">{Math.round(max * ratio)}</text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const height = (item.count / max) * usableHeight;
          const x = left + index * slot + (slot - barWidth) / 2;
          const y = top + usableHeight - height;
          return (
            <g key={item.month}>
              <rect x={x} y={y} width={barWidth} height={Math.max(2, height)} rx="6" fill="url(#bar-gradient)" />
              <text x={x + barWidth / 2} y={chartHeight - 10} textAnchor="middle" fontSize="11" fill="#5E6B7A" className="dark:fill-slate-400">{monthLabel(item.month)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatusDonut({ summary }: { summary: Dashboard["summary"] }) {
  const statuses = [
    { label: "Mới", value: summary.newOrders, color: "#2563eb", dot: "bg-blue-600" },
    { label: "Đang xử lý", value: summary.processingOrders, color: "#f59e0b", dot: "bg-accent-amber" },
    { label: "Hoàn tất", value: summary.doneOrders, color: "#10b981", dot: "bg-accent-emerald" },
    { label: "Từ chối", value: summary.rejectedOrders, color: "#e11d48", dot: "bg-rose-600" },
  ];
  const total = statuses.reduce((sum, item) => sum + item.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;
  const completionRate = total ? Math.round((summary.doneOrders / total) * 100) : 0;

  return (
    <div className="grid gap-6 sm:grid-cols-[176px_1fr] sm:items-center">
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90 drop-shadow-sm" role="img" aria-label={`Phân bố ${total} đơn theo trạng thái`}>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-white/10" />
          {total > 0 && statuses.map((item) => {
            const fraction = item.value / total;
            const length = Math.max(0, fraction * circumference - (item.value > 0 ? 2.5 : 0));
            const offset = -consumed * circumference;
            consumed += fraction;
            return <circle key={item.label} cx="70" cy="70" r={radius} fill="none" stroke={item.color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={offset} className="transition-all duration-700 hover:opacity-80" aria-label={`${item.label}: ${item.value} đơn, ${Math.round(fraction * 100)} phần trăm`}><title>{item.label}: {item.value} đơn ({Math.round(fraction * 100)}%)</title></circle>;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><strong className="block text-2xl text-slate-950 dark:text-white">{completionRate}%</strong><span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">hoàn tất<br />{numberFormat.format(total)} tổng đơn</span></div></div>
      </div>
      <dl className="grid gap-3 text-sm">
        {statuses.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50 dark:hover:bg-white/5">
            <dt className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} aria-hidden="true" />{item.label}</dt>
            <dd className="font-semibold">{numberFormat.format(item.value)} <span className="ml-1 text-xs font-normal text-slate-500">({total ? Math.round((item.value / total) * 100) : 0}%)</span></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function DashboardView() {
  const [months, setMonths] = useState("6");
  const [reloadToken, setReloadToken] = useState(0);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getDashboard(Number(months))
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((caught: unknown) => {
        if (active) {
          setData(null);
          setError(caught instanceof Error ? caught.message : "Không thể tải dashboard.");
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [months, reloadToken]);

  const topPlanMax = useMemo(() => Math.max(1, ...(data?.topServicePlans.map((item) => item.count) ?? [0])), [data]);

  return (
    <div className="mx-auto max-w-7xl animate-[sr-kf-fadeUp_0.6s_forwards]">
      <PageHeading title="Dashboard vận hành" description="Một màn hình để đọc nhu cầu, trạng thái xử lý và sức hút của từng gói dịch vụ." action={<div className="flex items-end gap-2"><Select label="Khoảng thời gian" name="dashboard-months" value={months} onChange={(event) => { setLoading(true); setError(""); setMonths(event.target.value); }}><option value="3">3 tháng</option><option value="6">6 tháng</option><option value="12">12 tháng</option><option value="24">24 tháng</option></Select><Button type="button" variant="secondary" onClick={() => { setLoading(true); setError(""); setReloadToken((value) => value + 1); }}>Làm mới</Button></div>} />
      {loading && <Card><Loading label="Đang tải số liệu dashboard..." /></Card>}
      {!loading && error && <Card><ErrorState title="Không thể tải dashboard" description={error} /></Card>}
      {!loading && !error && data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-[sr-kf-fadeUp_0.7s_forwards]">
          {[["Tổng yêu cầu", data.summary.totalOrders], ["Mới cần xử lý", data.summary.newOrders], ["Đang xử lý", data.summary.processingOrders], ["Đã hoàn tất", data.summary.doneOrders], ["Từ chối", data.summary.rejectedOrders], ["Tổng affiliate", data.summary.totalAffiliateApplications], ["Affiliate mới", data.summary.newAffiliateApplications ?? 0], ["Liên hệ mới", data.summary.newContacts]].map(([label, value]) => (
            <Card key={String(label)} className="p-5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-river-600 to-accent-cyan bg-clip-text text-transparent dark:from-accent-cyan dark:to-accent-indigo">{numberFormat.format(Number(value))}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] animate-[sr-kf-fadeUp_0.8s_forwards]">
          <Card><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-river-700 dark:text-accent-cyan">Demand trend</p><h2 className="mt-2 text-lg font-bold dark:text-white">Yêu cầu đặt dịch vụ theo tháng</h2></div><Badge variant="info">UTC → local</Badge></div><div className="mt-5"><BarChart data={data.ordersByMonth} /></div></Card>
          <Card><p className="text-xs font-semibold uppercase tracking-[0.16em] text-river-700 dark:text-accent-cyan">Workflow health</p><h2 className="mt-2 text-lg font-bold dark:text-white">Phân bố trạng thái đơn</h2><div className="mt-6"><StatusDonut summary={data.summary} /></div></Card>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr] animate-[sr-kf-fadeUp_0.9s_forwards]">
          <Card><p className="text-xs font-semibold uppercase tracking-[0.16em] text-river-700 dark:text-accent-cyan">Product interest</p><h2 className="mt-2 text-lg font-bold dark:text-white">Gói được quan tâm</h2>{data.topServicePlans.length === 0 ? <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">Chưa có yêu cầu để xếp hạng gói.</p> : <ol className="mt-5 grid gap-4">{data.topServicePlans.map((item, index) => <li key={item.servicePlanId}><div className="flex items-center justify-between gap-3 text-sm"><span><strong className="mr-2 text-river-700 dark:text-accent-cyan">{index + 1}.</strong>{item.planName}</span><strong>{numberFormat.format(item.count)}</strong></div><div className="mt-2 h-2 rounded-full bg-ice-100 dark:bg-white/10 overflow-hidden"><div className="h-2 rounded-full bg-gradient-to-r from-river-600 to-accent-cyan transition-all duration-1000" style={{ width: `${Math.max(4, (item.count / topPlanMax) * 100)}%` }} /></div></li>)}</ol>}</Card>
          <Card><p className="text-xs font-semibold uppercase tracking-[0.16em] text-river-700 dark:text-accent-cyan">Operator cue</p><h2 className="mt-2 text-lg font-bold dark:text-white">Việc nên ưu tiên</h2><ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400"><li className="rounded-xl bg-ice-100/70 p-3 transition-colors hover:bg-ice-100 dark:bg-white/5 dark:hover:bg-white/10"><strong className="text-ink-950 dark:text-white">{numberFormat.format(data.summary.newOrders)} đơn mới</strong> đang chờ tiếp nhận.</li><li className="rounded-xl bg-ice-100/70 p-3 transition-colors hover:bg-ice-100 dark:bg-white/5 dark:hover:bg-white/10"><strong className="text-ink-950 dark:text-white">{numberFormat.format(data.summary.processingOrders)} đơn</strong> đang ở bước xử lý.</li><li className="rounded-xl bg-ice-100/70 p-3 transition-colors hover:bg-ice-100 dark:bg-white/5 dark:hover:bg-white/10"><strong className="text-ink-950 dark:text-white">{numberFormat.format(data.summary.newAffiliateApplications ?? 0)} affiliate mới</strong> đang chờ duyệt.</li><li className="rounded-xl bg-ice-100/70 p-3 transition-colors hover:bg-ice-100 dark:bg-white/5 dark:hover:bg-white/10"><strong className="text-ink-950 dark:text-white">{numberFormat.format(data.summary.newContacts)} liên hệ mới</strong> cần được phản hồi.</li></ul></Card>
        </div>
      </>}
    </div>
  );
}
