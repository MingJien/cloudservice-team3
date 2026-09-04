"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getOrders, updateOrderStatus, type OrderItem, type OrderStatus } from "@/features/orders/api";
import type { Page } from "@/features/catalog/types";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";

function statusVariant(status: OrderStatus): "success" | "warning" | "danger" | "info" {
  if (status === "Done") return "success";
  if (status === "Rejected") return "danger";
  if (status === "Processing") return "warning";
  return "info";
}

export function OrdersEnterpriseView() {
  const [data, setData] = useState<Page<OrderItem> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<{ order: OrderItem; status: OrderStatus; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      setData(await getOrders(query.toString()));
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải danh sách đơn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
    if (status) query.set("status", status);
    if (search) query.set("search", search);
    getOrders(query.toString())
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải danh sách đơn."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function submitStatus() {
    if (!target) return;
    if (target.status === "Rejected" && !note.trim()) {
      setError("Phải nhập lý do khi từ chối đơn.");
      return;
    }
    try {
      await updateOrderStatus(target.order.id, {
        status: target.status,
        internalNote: note.trim() || null,
        rowVersion: target.order.rowVersion,
      });
      setTarget(null);
      setNote("");
      await load();
    } catch (caught) {
      setTarget(null);
      setError(caught instanceof Error ? `${caught.message} Dữ liệu mới nhất đang được tải lại.` : "Không thể cập nhật đơn.");
      await load();
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading title="Yêu cầu đặt dịch vụ" description="Có attribution affiliate, snapshot hoa hồng, audit và optimistic concurrency để hai nhân viên không ghi đè nhau." />
      <form onSubmit={applyFilters} className="mb-5 grid gap-3 rounded-2xl border border-line-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_220px_auto] md:items-end">
        <Input label="Tìm theo mã, tên hoặc email" name="order-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <Select label="Trạng thái" name="order-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">Tất cả</option><option value="New">Mới</option><option value="Processing">Đang xử lý</option><option value="Done">Hoàn tất</option><option value="Rejected">Từ chối</option>
        </Select>
        <Button type="submit" variant="secondary">Áp dụng</Button>
      </form>
      {error && <div className="mb-4 rounded-xl border border-danger-600/30 bg-danger-600/5 p-3 text-sm text-danger-600">{error}</div>}
      <TableShell loading={loading} isEmpty={!loading && (data?.items.length ?? 0) === 0} emptyTitle="Không có yêu cầu phù hợp" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}>
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-ice-100/70 text-xs uppercase tracking-wide dark:bg-white/5"><tr><th className="px-4 py-3">Khách hàng</th><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Affiliate</th><th className="px-4 py-3">Giá trị</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-line-200 dark:divide-white/10">
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3"><strong>{item.customerName}</strong><span className="block text-xs text-slate-500">{item.email} · {item.trackingCode}</span></td>
                <td className="px-4 py-3 text-sm">#{item.servicePlanId} · {item.planName}<span className="block text-xs text-slate-500">{item.billingCycle}</span></td>
                <td className="px-4 py-3 text-sm">{item.affiliateCode ? <><strong className="text-river-700 dark:text-cyan-300">{item.affiliateCode}</strong><span className="block text-xs text-slate-500">Hoa hồng {(item.affiliateCommissionAmount ?? 0).toLocaleString("vi-VN")} đ</span></> : <span className="text-slate-400">Trực tiếp</span>}</td>
                <td className="px-4 py-3 font-semibold">{item.estimatedAmount.toLocaleString("vi-VN")} {item.currency}</td>
                <td className="px-4 py-3"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                  {item.status === "New" && <><Button onClick={() => setTarget({ order: item, status: "Processing", label: "Tiếp nhận yêu cầu" })}>Nhận xử lý</Button><Button variant="danger" onClick={() => setTarget({ order: item, status: "Rejected", label: "Từ chối yêu cầu" })}>Từ chối</Button></>}
                  {item.status === "Processing" && <><Button onClick={() => setTarget({ order: item, status: "Done", label: "Hoàn tất yêu cầu" })}>Hoàn tất</Button><Button variant="danger" onClick={() => setTarget({ order: item, status: "Rejected", label: "Từ chối yêu cầu" })}>Từ chối</Button></>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
      <Modal open={Boolean(target)} title={target?.label ?? "Cập nhật yêu cầu"} onClose={() => { setTarget(null); setNote(""); }}>
        <div className="grid gap-4"><label className="grid gap-2 text-sm font-medium">{target?.status === "Rejected" ? "Lý do từ chối (bắt buộc)" : "Ghi chú nội bộ"}<textarea className="min-h-28 rounded-xl border border-line-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} /></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTarget(null)}>Hủy</Button><Button onClick={() => void submitStatus()}>Xác nhận</Button></div></div>
      </Modal>
    </div>
  );
}
