import type { ReactNode } from "react";

export function EmptyState({ title = "Chưa có dữ liệu", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-200 bg-paper-50 px-6 py-10 text-center">
      <h3 className="font-semibold text-ink-950">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
