"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteAffiliate, getAffiliates, updateAffiliate, updateAffiliateStatus, type Affiliate, type ProvisionedAffiliateAccount } from "@/features/affiliates/api";
import type { Page } from "@/features/catalog/types";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [editing, setEditing] = useState<Affiliate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Affiliate | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "", websiteOrChannel: "", note: "", partnerIsActive: true });
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [provisioned, setProvisioned] = useState<ProvisionedAffiliateAccount | null>(null);

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
  }

  async function submit() {
    if (!target) return;
    try {
      const result = await updateAffiliateStatus(target.item.id, {
        status: target.status,
        internalNote: note.trim() || null,
        affiliateCode: target.status === "Done" ? code.trim().toUpperCase() || null : null,
      });
      setTarget(null);
      setProvisioned(result.provisionedAccount);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật affiliate.");
    }
  }

  function beginEdit(item: Affiliate) {
    setEditError("");
    setNotice("");
    setEditing(item);
    setEditForm({
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      websiteOrChannel: item.websiteOrChannel ?? "",
      note: item.note ?? "",
      partnerIsActive: item.partnerIsActive ?? true,
    });
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    if (!/^0\d{9}$/.test(editForm.phone)) { setEditError("Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0."); return; }
    setEditBusy(true);
    setEditError("");
    try {
      await updateAffiliate(editing.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone,
        websiteOrChannel: editForm.websiteOrChannel.trim() || null,
        note: editForm.note.trim() || null,
        partnerIsActive: editing.affiliateCode ? editForm.partnerIsActive : null,
        rowVersion: editing.rowVersion,
      });
      setEditing(null);
      setNotice(`Đã lưu thay đổi cho hồ sơ ${editing.trackingCode}.`);
      await load();
    } catch (caught) {
      setEditError(caught instanceof Error ? caught.message : "Không thể sửa affiliate.");
    } finally {
      setEditBusy(false);
    }
  }

  async function remove() {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteAffiliate(pendingDelete.id, pendingDelete.rowVersion);
      const archivedCode = pendingDelete.trackingCode;
      setPendingDelete(null);
      setNotice(`Đã lưu trữ hồ sơ ${archivedCode}; lịch sử đối soát vẫn được giữ nguyên.`);
      await load();
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Không thể xóa affiliate.");
    } finally {
      setDeleteBusy(false);
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
      {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{notice}</div>}
      <TableShell loading={loading} isEmpty={!loading && (data?.items.length ?? 0) === 0} emptyTitle="Chưa có hồ sơ phù hợp" footer={data ? <Pagination pageNumber={data.pageNumber} totalPages={data.totalPages} onPageChange={setPage} /> : undefined}>
        <table className="w-full min-w-[1100px] text-left"><thead className="bg-ice-100/70 text-xs uppercase tracking-wide dark:bg-white/5"><tr><th className="px-4 py-3">Đối tác</th><th className="px-4 py-3">Mã & tỷ lệ</th><th className="px-4 py-3">Hiệu quả</th><th className="px-4 py-3">Hoa hồng chờ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-line-200 dark:divide-white/10">{data?.items.map((item) => <tr key={item.id}>
            <td className="px-4 py-3"><strong>{item.fullName}</strong><span className="block text-xs text-slate-500">{item.email} · {item.phone}</span><code className="mt-1 block font-mono text-[11px] text-slate-500">{item.trackingCode}</code><span className="block text-xs text-slate-500">{item.websiteOrChannel ?? "Chưa khai báo kênh"}</span></td>
            <td className="px-4 py-3">{item.affiliateCode ? <><code className="rounded bg-river-600/10 px-2 py-1 font-bold text-river-700 dark:text-cyan-300">{item.affiliateCode}</code><span className="mt-1 block text-xs">{item.commissionRate}%</span></> : <span className="text-slate-400">Chưa cấp mã</span>}</td>
            <td className="px-4 py-3 text-sm"><strong>{item.clickCount}</strong> click · <strong>{item.conversionCount}</strong> đơn</td>
            <td className="px-4 py-3 font-semibold">{item.pendingCommission.toLocaleString("vi-VN")} đ</td>
            <td className="px-4 py-3"><Badge variant={item.status === "Done" ? "success" : item.status === "Rejected" ? "danger" : "warning"}>{item.status}</Badge></td>
            <td className="px-4 py-3"><div className="flex flex-col items-end gap-1.5">{item.status === "New" && <Button onClick={() => choose(item, "Processing", "Tiếp nhận hồ sơ")}>Xử lý</Button>}{item.status === "Processing" && <><Button onClick={() => choose(item, "Done", "Duyệt và cấp mã affiliate")}>Duyệt</Button><Button variant="danger" onClick={() => choose(item, "Rejected", "Từ chối hồ sơ")}>Từ chối</Button></>}<Button variant="secondary" onClick={() => beginEdit(item)}><Pencil size={14} /> Sửa</Button><Button variant="danger" onClick={() => setPendingDelete(item)}><Trash2 size={14} /> Xóa</Button></div></td>
          </tr>)}</tbody>
        </table>
      </TableShell>
      <Modal open={Boolean(target)} title={target?.label ?? "Cập nhật affiliate"} onClose={() => setTarget(null)}>
        <div className="grid gap-4">
          {target?.status === "Done" && <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><Input label="Mã affiliate (để trống sẽ tự sinh)" name="affiliate-code" value={code} maxLength={50} onChange={(event) => setCode(event.target.value.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase())} /><div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-sm"><strong className="block text-emerald-700 dark:text-emerald-300">Newbie · 5%</strong><span className="text-xs text-slate-500">Tỷ lệ tự động theo tier, không nhập tay.</span></div></div>}
          <label className="grid gap-2 text-sm font-medium">Ghi chú nội bộ<textarea className="min-h-28 rounded-xl border border-line-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} /></label>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTarget(null)}>Hủy</Button><Button onClick={() => void submit()}>Xác nhận</Button></div>
        </div>
      </Modal>
      <Modal open={Boolean(editing)} title="Sửa hồ sơ Affiliate" onClose={() => { if (!editBusy) setEditing(null); }}>
        <form className="grid gap-4" onSubmit={saveEdit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Họ và tên" name="affiliate-edit-name" required maxLength={150} value={editForm.fullName} onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })} />
            <Input label="Email" name="affiliate-edit-email" type="email" required maxLength={255} value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} />
            <Input label="Số điện thoại" name="affiliate-edit-phone" required inputMode="numeric" maxLength={10} value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })} />
            <Input label="Website / kênh HTTPS" name="affiliate-edit-channel" type="url" maxLength={500} value={editForm.websiteOrChannel} onChange={(event) => setEditForm({ ...editForm, websiteOrChannel: event.target.value })} />
            {editing?.affiliateCode && <div className="rounded-xl border border-[#c9dfec] bg-[#f4f9fc] px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.04]"><span className="text-xs text-slate-500">Hoa hồng theo tier</span><strong className="block text-[#0873b8] dark:text-cyan-300">{editing.commissionRate}% · tự động đánh giá hàng tháng</strong></div>}
            {editing?.affiliateCode && <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-line-200 px-3 text-sm font-semibold dark:border-white/10"><input type="checkbox" checked={editForm.partnerIsActive} onChange={(event) => setEditForm({ ...editForm, partnerIsActive: event.target.checked })} /> Cho phép mã Affiliate nhận đơn mới</label>}
          </div>
          <label className="grid gap-2 text-sm font-semibold">Ghi chú ứng viên<textarea className="min-h-24 rounded-xl border border-line-200 bg-white px-3 py-2 outline-none focus:border-river-600 dark:border-white/10 dark:bg-white/5" maxLength={2000} value={editForm.note} onChange={(event) => setEditForm({ ...editForm, note: event.target.value })} /></label>
          <p className="text-xs leading-5 text-slate-500">Mã Affiliate không cho sửa sau khi cấp vì đã được chụp snapshot trong referral, đơn hàng và hoa hồng.</p>
          {editError && <p role="alert" className="rounded-xl border border-danger-600/25 bg-danger-600/[0.06] px-3 py-2.5 text-sm font-medium text-danger-600">{editError}</p>}
          <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={editBusy} onClick={() => setEditing(null)}>Hủy</Button><Button type="submit" isLoading={editBusy}>Lưu thay đổi</Button></div>
        </form>
      </Modal>
      <ConfirmDialog open={pendingDelete !== null} title="Xóa hồ sơ Affiliate?" description={`Hồ sơ ${pendingDelete?.trackingCode ?? ""} sẽ được lưu trữ mềm để giữ audit và báo cáo. Nếu đã có mã đối tác, mã sẽ ngừng nhận referral mới; dữ liệu click, đơn và hoa hồng cũ không bị mất.`} confirmLabel="Xóa hồ sơ" destructive busy={deleteBusy} error={deleteError} onClose={() => { setPendingDelete(null); setDeleteError(""); }} onConfirm={() => void remove()} />
      <Modal open={provisioned !== null} title="Tài khoản đối tác đã được cấp" onClose={() => setProvisioned(null)}>
        <div className="grid gap-4">
          <p className="text-sm leading-6 text-slate-600">Thông tin dưới đây chỉ hiển thị một lần. Gửi qua kênh đã xác minh và yêu cầu đối tác đổi mật khẩu ngay lần đăng nhập đầu.</p>
          <div className="rounded-2xl border border-[#b8d9e9] bg-[#f1f9fd] p-4 dark:border-[#67e8f9]/25 dark:bg-[#22d3ee]/[0.06]">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Tên đăng nhập</span>
            <code className="mt-1 block break-all text-base font-black text-[#075f9d] dark:text-cyan-300">{provisioned?.userName}</code>
            <span className="mt-4 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">Mật khẩu tạm thời</span>
            <code className="mt-1 block break-all text-lg font-black tracking-wide text-[#07101f] dark:text-white">{provisioned?.temporaryPassword}</code>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">Email: {provisioned?.emailDeliveryStatus === "Sent" ? "đã gửi thành công" : provisioned?.emailDeliveryStatus === "Disabled" ? "SMTP chưa bật; hãy chuyển thông tin qua kênh đã xác minh" : "gửi thất bại; hãy dùng biên nhận một lần này"}.</p>
          <div className="flex justify-end"><Button onClick={() => setProvisioned(null)}>Tôi đã lưu an toàn</Button></div>
        </div>
      </Modal>
    </div>
  );
}
