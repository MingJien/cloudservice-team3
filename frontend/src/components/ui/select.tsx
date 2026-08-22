import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ id, label, error, className, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="flex flex-col min-w-0 gap-2 text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]" htmlFor={selectId}>
      {label}
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        className={cn("min-h-11 w-full min-w-0 max-w-full rounded-xl border border-[#ccdeeb] bg-[#f7fbfe] px-3 py-2 text-base font-medium text-[#07101f] shadow-[inset_0_1px_2px_rgba(7,64,103,.04)] outline-none transition-all duration-300 hover:border-[#a9cbe0] focus:border-[#0b8bd8] focus:bg-white focus:ring-4 focus:ring-[#0b8bd8]/15 dark:border-white/[0.1] dark:bg-[#071426]/78 dark:text-white dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.32)] dark:hover:border-white/20 dark:focus:border-[#67e8f9] dark:focus:bg-[#09192d] dark:focus:ring-[#22d3ee]/20", error && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20 dark:border-danger-500 dark:focus:border-danger-500", className)}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs font-normal text-danger-600">{error}</span>}
    </label>
  );
}
