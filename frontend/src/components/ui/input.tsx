import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function Input({ id, label, error, hint, className, containerClassName, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const helpId = inputId ? `${inputId}-help` : undefined;
  const wrapperClassName = cn("flex flex-col min-w-0 gap-2 text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]", containerClassName);
  const supportingText = (error || hint) ? (
    <span id={helpId} className={cn("text-xs font-normal", error ? "text-danger-600" : "text-slate-600")}>{error ?? hint}</span>
  ) : null;
  const control = (
    <input
      id={inputId}
      aria-describedby={error || hint ? helpId : undefined}
      aria-invalid={Boolean(error)}
      className={cn(
        "min-h-11 w-full min-w-0 max-w-full rounded-xl border border-[#ccdeeb] bg-[#f7fbfe] px-3 py-2 text-base font-medium text-[#07101f] shadow-[inset_0_1px_2px_rgba(7,64,103,.04)] outline-none transition-all duration-300 placeholder:text-[#7b8fa4] hover:border-[#a9cbe0] focus:border-[#0b8bd8] focus:bg-white focus:ring-4 focus:ring-[#0b8bd8]/15 dark:border-white/[0.1] dark:bg-[#071426]/78 dark:text-white dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.32)] dark:hover:border-white/20 dark:focus:border-[#67e8f9] dark:focus:bg-[#09192d] dark:focus:ring-[#22d3ee]/20 dark:placeholder:text-[#71859a]",
        error && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20 dark:border-danger-500 dark:focus:border-danger-500",
        className,
      )}
      {...props}
    />
  );

  if (!label) {
    return <div className={wrapperClassName}>{control}{supportingText}</div>;
  }

  return (
    <label className={wrapperClassName} htmlFor={inputId}>
      {label}
      {control}
      {supportingText}
    </label>
  );
}
