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
    <div className="overflow-hidden rounded-2xl border border-line-200 bg-white">
      {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorState description={error} /></div> : isEmpty ? <div className="p-6"><EmptyState title={emptyTitle} /></div> : <div className="overflow-x-auto">{children}</div>}
      {footer && !loading && !error && !isEmpty && <div className="p-4">{footer}</div>}
    </div>
  );
}

export function DataTable({ children, caption }: { children: ReactNode; caption: string }) {
  return <table className="w-full min-w-2xl border-collapse text-left text-sm"><caption className="sr-only">{caption}</caption>{children}</table>;
}
