"use client";

import { Button } from "./button";
import { Modal } from "./modal";

export function ConfirmDialog({ open, title, description, confirmLabel = "Xác nhận", onConfirm, onClose, destructive = false, busy = false, error }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={() => { if (!busy) onClose(); }}>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      {error && <p role="alert" className="mt-4 rounded-xl border border-danger-600/25 bg-danger-600/[0.06] px-3 py-2.5 text-sm font-medium text-danger-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" disabled={busy} onClick={onClose}>Hủy</Button>
        <Button variant={destructive ? "danger" : "primary"} isLoading={busy} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
