import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { Loading } from "./loading";

export function TableShell({ children, loading = false, error, isEmpty = false, emptyTitle, footer }: {
  children: ReactNode;
  loading?: boolean;
  error?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-200 bg-white/70 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all dark:bg-ink-900/40 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorState description={error} /></div> : isEmpty ? <div className="p-6"><EmptyState title={emptyTitle} /></div> : <div className="overflow-x-auto">{children}</div>}
      {footer && !loading && !error && !isEmpty && <div className="p-4">{footer}</div>}
    </div>
  );
}

export function DataTable({ children, caption }: { children: ReactNode; caption: string }) {
  return <table className="w-full min-w-2xl border-collapse text-left text-sm [&_thead]:bg-ice-100/50 dark:[&_thead]:bg-white/5 [&_tr]:border-b [&_tr]:border-line-200 dark:[&_tr]:border-white/5 [&_tr]:transition-colors [&_tbody_tr:hover]:bg-ice-50/50 dark:[&_tbody_tr:hover]:bg-white/[0.02] [&_th]:font-semibold [&_th]:text-slate-600 dark:[&_th]:text-slate-400 [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-xs"><caption className="sr-only">{caption}</caption>{children}</table>;
}
