import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ id, label, error, hint, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const helpId = inputId ? `${inputId}-help` : undefined;

  return (
    <label className="grid gap-2 text-sm font-medium text-ink-950" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        aria-describedby={error || hint ? helpId : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-11 rounded-xl border border-line-200 bg-white px-3 py-2 text-base font-normal outline-none transition focus:border-river-600 focus:ring-2 focus:ring-river-600/15",
          error && "border-danger-600",
          className,
        )}
        {...props}
      />
      {(error || hint) && <span id={helpId} className={cn("text-xs font-normal", error ? "text-danger-600" : "text-slate-600")}>{error ?? hint}</span>}
    </label>
  );
}
