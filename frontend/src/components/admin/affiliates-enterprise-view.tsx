"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAffiliates, updateAffiliateStatus, type Affiliate } from "@/features/affiliates/api";
import type { Page } from "@/features/catalog/types";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";

export function AffiliatesEnterpriseView() {
  const [data, setData] = useState<Page<Affiliate> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<{ item: Affiliate; status: Affiliate["status"]; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      setData(await getAffiliates(query.toString()));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải affiliate.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
    if (status) query.set("status", status);
    if (search) query.set("search", search);
    getAffiliates(query.toString())
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải affiliate."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);

  function choose(item: Affiliate, nextStatus: Affiliate["status"], label: string) {
    setTarget({ item, status: nextStatus, label });
    setNote("");
    setCode(item.affiliateCode ?? "");
    setCommissionRate(String(item.commissionRate ?? 10));
  }

  async function submit() {
    if (!target) return;
    const rate = Number(commissionRate);
    if (target.status === "Done" && (!Number.isFinite(rate) || rate < 0 || rate > 100)) {
      setError("Tỷ lệ hoa hồng phải nằm trong khoảng 0-100%.");
      return;
    }
    try {
      await updateAffiliateStatus(target.item.id, {
        status: target.status,
        internalNote: note.trim() || null,
        affiliateCode: target.status === "Done" ? code.trim().toUpperCase() || null : null,
        commissionRate: target.status === "Done" ? rate : null,
      });
      setTarget(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật affiliate.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading title="Affiliate & Attribution" description="Hồ sơ được duyệt sẽ trở thành đối tác có mã riêng. Click, conversion và commission được tính từ dữ liệu attribution, không tăng counter thủ công." />
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} className="mb-5 grid gap-3 rounded-2xl border border-line-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_220px_auto] md:items-end">
        <Input label="Tìm theo tên hoặc email" name="affiliate-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <Select label="Trạng thái" name="affiliate-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Tất cả</option><option value="New">Mới</option><option value="Processing">Đang xử lý</option><option value="Done">Đã duyệt</option><option value="Rejected">Từ chối</option></Select>
        <Button type="submit" variant="secondary">Áp dụng</Button>
      </form>
      {error && <div className="mb-4 rounded-xl border border-danger-600/30 bg-danger-600/5 p-3 text-sm text-danger-600">{error}</div>}
      <TableShell loading={loading} isEmpty={!loading && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có hồ sơ phù hợp" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}>
        <table className="w-full min-w-[960px] text-left"><thead className="bg-ice-100/70 text-xs uppercase tracking-wide dark:bg-white/5"><tr><th className="px-4 py-3">Đối tác</th><th className="px-4 py-3">Mã & tỷ lệ</th><th className="px-4 py-3">Hiệu quả</th><th className="px-4 py-3">Hoa hồng chờ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-line-200 dark:divide-white/10">{data?.items.map((item) => <tr key={item.id}>
            <td className="px-4 py-3"><strong>{item.fullName}</strong><span className="block text-xs text-slate-500">{item.email} · {item.phone}</span><span className="block text-xs text-slate-500">{item.websiteOrChannel ?? "Chưa khai báo kênh"}</span></td>
            <td className="px-4 py-3">{item.affiliateCode ? <><code className="rounded bg-river-600/10 px-2 py-1 font-bold text-river-700 dark:text-cyan-300">{item.affiliateCode}</code><span className="mt-1 block text-xs">{item.commissionRate}%</span></> : <span className="text-slate-400">Chưa cấp mã</span>}</td>
            <td className="px-4 py-3 text-sm"><strong>{item.clickCount}</strong> click · <strong>{item.conversionCount}</strong> đơn</td>
            <td className="px-4 py-3 font-semibold">{item.pendingCommission.toLocaleString("vi-VN")} đ</td>
            <td className="px-4 py-3"><Badge variant={item.status === "Done" ? "success" : item.status === "Rejected" ? "danger" : "warning"}>{item.status}</Badge></td>
            <td className="px-4 py-3"><div className="flex gap-2">{item.status === "New" && <Button onClick={() => choose(item, "Processing", "Tiếp nhận hồ sơ")}>Xử lý</Button>}{item.status === "Processing" && <><Button onClick={() => choose(item, "Done", "Duyệt và cấp mã affiliate")}>Duyệt</Button><Button variant="danger" onClick={() => choose(item, "Rejected", "Từ chối hồ sơ")}>Từ chối</Button></>}</div></td>
          </tr>)}</tbody>
        </table>
      </TableShell>
      <Modal open={Boolean(target)} title={target?.label ?? "Cập nhật affiliate"} onClose={() => setTarget(null)}>
        <div className="grid gap-4">
          {target?.status === "Done" && <div className="grid gap-4 sm:grid-cols-2"><Input label="Mã affiliate (để trống sẽ tự sinh)" name="affiliate-code" value={code} maxLength={50} onChange={(event) => setCode(event.target.value.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase())} /><Input label="Hoa hồng (%)" name="commission-rate" type="number" min="0" max="100" step="0.01" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} /></div>}
          <label className="grid gap-2 text-sm font-medium">Ghi chú nội bộ<textarea className="min-h-28 rounded-xl border border-line-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTarget(null)}>Hủy</Button><Button onClick={() => void submit()}>Xác nhận</Button></div>
        </div>
      </Modal>
    </div>
  );
}
