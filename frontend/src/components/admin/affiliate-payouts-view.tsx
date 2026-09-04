"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import { getAdminAffiliatePayouts, reviewAffiliatePayout, type AffiliatePayout, type PayoutStatus } from "@/features/affiliates/portal-api";
import type { Page } from "@/features/catalog/types";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function AffiliatePayoutsView() {
  const [data, setData] = useState<Page<AffiliatePayout> | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [review, setReview] = useState<{ item: AffiliatePayout; status: PayoutStatus; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      setData(await getAdminAffiliatePayouts(query.toString())); setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể tải yêu cầu rút tiền."); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ pageNumber: String(page), pageSize: "20" });
    if (status) query.set("status", status);
    if (search) query.set("search", search);
    getAdminAffiliatePayouts(query.toString())
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải yêu cầu rút tiền."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);

  function open(item: AffiliatePayout, nextStatus: PayoutStatus, label: string) { setReview({ item, status: nextStatus, label }); setNote(""); setReviewError(""); }
  async function submit() {
    if (!review) return;
    if (review.status === "Rejected" && !note.trim()) { setReviewError("Phải ghi lý do từ chối để đối tác hiểu và hoa hồng được trả về ví đúng căn cứ."); return; }
    setBusy(true); setReviewError("");
    try {
      await reviewAffiliatePayout(review.item.id, { status: review.status, reviewNote: note.trim() || null, rowVersion: review.item.rowVersion });
      setNotice(`Đã cập nhật ${review.item.requestCode} sang ${review.status}.`); setReview(null); await load();
    } catch (caught) { setReviewError(caught instanceof Error ? caught.message : "Không thể cập nhật đối soát."); }
    finally { setBusy(false); }
  }

  const metrics = [
    { label: "Chờ xử lý", value: data?.items.filter((item) => item.status === "Requested").length ?? 0, icon: Banknote },
    { label: "Đang đối soát", value: data?.items.filter((item) => item.status === "Processing").length ?? 0, icon: ShieldCheck },
    { label: "Đã thanh toán trên trang", value: data?.items.filter((item) => item.status === "Paid").reduce((sum, item) => sum + item.amount, 0) ?? 0, icon: CheckCircle2, money: true },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading title="Đối soát Affiliate" description="Mỗi yêu cầu khóa các commission khả dụng cụ thể. Đánh dấu đã trả sẽ chốt sổ; từ chối tự giải phóng tiền về ví đối tác." />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, money: useMoney }) => (
          <article key={label} className="rounded-[1.25rem] border border-[#d5e5f0] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(7,64,103,.48)] dark:border-white/[0.08] dark:bg-[#0d1b32]/90">
            <Icon size={18} className="text-[#0873b8] dark:text-cyan-300" />
            <span className="mt-4 block text-xs font-bold text-slate-500">{label}</span>
            <strong className="mt-1 block text-2xl tabular-nums">{useMoney ? money.format(value) : value}</strong>
          </article>
        ))}
      </div>

      <form className="mb-5 grid gap-3 rounded-2xl border border-[#d5e5f0] bg-white p-4 dark:border-white/[0.08] dark:bg-[#0d1b32]/90 md:grid-cols-[1fr_220px_auto] md:items-end" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }}>
        <Input label="Mã rút / mã đối tác / tên" name="payout-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        <Select label="Trạng thái" name="payout-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
          <option value="">Tất cả</option><option value="Requested">Đã gửi</option><option value="Processing">Đang đối soát</option><option value="Paid">Đã trả</option><option value="Rejected">Từ chối</option>
        </Select>
        <Button type="submit" variant="secondary"><Search size={15} /> Lọc</Button>
      </form>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{notice}</p>}

      <TableShell loading={loading} isEmpty={!loading && !data?.items.length} emptyTitle="Chưa có yêu cầu rút tiền" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#f3f8fb] text-[.67rem] uppercase tracking-[.12em] text-slate-500 dark:bg-white/[0.04]"><tr><th className="px-4 py-3">Yêu cầu</th><th className="px-4 py-3">Đối tác</th><th className="px-4 py-3">Tài khoản nhận</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-[#e1ebf2] dark:divide-white/[0.07]">
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4"><strong>{item.requestCode}</strong><span className="block text-xs text-slate-500">{date.format(new Date(item.requestedAtUtc))}</span></td>
                <td className="px-4 py-4"><strong>{item.partnerName}</strong><code className="block text-xs text-[#0873b8] dark:text-cyan-300">{item.partnerCode}</code></td>
                <td className="px-4 py-4"><strong>{item.bankName}</strong><span className="block text-xs text-slate-500">{item.bankAccountNumber ?? item.maskedBankAccount} · {item.bankAccountName}</span></td>
                <td className="px-4 py-4 text-lg font-black tabular-nums">{money.format(item.amount)}</td>
                <td className="px-4 py-4"><Badge variant={item.status === "Paid" ? "success" : item.status === "Rejected" ? "danger" : "warning"}>{item.status}</Badge>{item.reviewNote && <span className="mt-1 block max-w-xs text-xs text-slate-500">{item.reviewNote}</span>}</td>
                <td className="px-4 py-4"><div className="flex flex-wrap justify-end gap-2">{item.status === "Requested" && <Button onClick={() => open(item, "Processing", "Tiếp nhận đối soát")}>Tiếp nhận</Button>}{(item.status === "Requested" || item.status === "Processing") && <><Button onClick={() => open(item, "Paid", "Xác nhận đã chuyển khoản")}><CheckCircle2 size={15} /> Đã trả</Button><Button variant="danger" onClick={() => open(item, "Rejected", "Từ chối yêu cầu")}><XCircle size={15} /> Từ chối</Button></>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <Modal open={review !== null} title={review?.label ?? "Cập nhật đối soát"} onClose={() => { if (!busy) setReview(null); }}>
        <div className="grid gap-4">
          <div className="rounded-xl border border-[#d3e4ed] bg-[#f4f9fc] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]"><span className="text-xs text-slate-500">Yêu cầu</span><strong className="block">{review?.item.requestCode}</strong><strong className="mt-2 block text-2xl tabular-nums">{review ? money.format(review.item.amount) : ""}</strong></div>
          <label className="grid gap-2 text-sm font-semibold">Ghi chú đối soát<textarea className="min-h-28 rounded-xl border border-[#ccdeeb] bg-[#f7fbfe] px-3 py-2 outline-none focus:border-[#0b8bd8] focus:ring-4 focus:ring-[#0b8bd8]/10 dark:border-white/10 dark:bg-[#071426]" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
          {reviewError && <p role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{reviewError}</p>}
          <div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setReview(null)}>Hủy</Button><Button variant={review?.status === "Rejected" ? "danger" : "primary"} isLoading={busy} onClick={() => void submit()}>Xác nhận</Button></div>
        </div>
      </Modal>
    </div>
  );
}
