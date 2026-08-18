import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ id, label, error, className, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="grid gap-2 text-sm font-medium text-ink-950" htmlFor={selectId}>
      {label}
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={cn("min-h-11 rounded-xl border border-line-200 bg-white px-3 py-2 text-base font-normal outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15", error && "border-danger-600", className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs font-normal text-danger-600">{error}</span>}
    </label>
  );
}
