"use client";

import { Button } from "./button";

export function Pagination({ pageNumber, totalPages, onPageChange }: { pageNumber: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-4 border-t border-line-200 pt-4">
      <Button variant="secondary" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>Trang trước</Button>
      <span className="text-sm text-slate-600">Trang <strong className="text-ink-950">{pageNumber}</strong> / {totalPages}</span>
      <Button variant="secondary" disabled={pageNumber >= totalPages} onClick={() => onPageChange(pageNumber + 1)}>Trang sau</Button>
    </nav>
  );
}
