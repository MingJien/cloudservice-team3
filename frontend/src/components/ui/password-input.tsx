"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function PasswordInput({ id, label, error, hint, className, containerClassName, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const helpId = `${inputId}-help`;
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu";

  return (
    <div className={cn("flex flex-col min-w-0 gap-2 text-sm font-medium text-ink-950", containerClassName)}>
      <label htmlFor={inputId}>{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type={isVisible ? "text" : "password"}
          aria-describedby={error || hint ? helpId : undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 bg-white/50 backdrop-blur-sm px-3 py-2 pr-12 text-base font-normal outline-none transition-all duration-300 focus:border-river-600 focus:ring-4 focus:ring-river-600/15 dark:bg-ink-950/50 dark:border-white/10 dark:text-white dark:focus:border-accent-cyan dark:focus:ring-accent-cyan/20 dark:placeholder:text-slate-500",
            error && "border-danger-600 focus:border-danger-600 focus:ring-danger-600/20 dark:border-danger-500 dark:focus:border-danger-500",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-slate-600 transition hover:bg-ice-100 hover:text-river-700 focus:outline-none focus:ring-2 focus:ring-river-600/30"
          aria-label={actionLabel}
          aria-pressed={isVisible}
          title={actionLabel}
          onClick={() => setIsVisible((value) => !value)}
        >
          {isVisible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="m3 3 18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.8 4.1 9.8 6.8a1.7 1.7 0 0 1 0 1.2 11.9 11.9 0 0 1-3.1 4.2" />
              <path d="M6.2 6.2A12.3 12.3 0 0 0 2.2 10.8a1.7 1.7 0 0 0 0 1.2C3.2 14.7 6.8 18.8 12 18.8c1 0 2-.2 2.9-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2">
              <path d="M2.2 12c1-2.7 4.6-6.8 9.8-6.8s8.8 4.1 9.8 6.8a1.7 1.7 0 0 1 0 1.2c-1 2.7-4.6 6.8-9.8 6.8S3.2 14.7 2.2 12a1.7 1.7 0 0 1 0-1.2Z" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
          )}
        </button>
      </div>
      {(error || hint) && <span id={helpId} className={cn("text-xs font-normal", error ? "text-danger-600" : "text-slate-600")}>{error ?? hint}</span>}
    </div>
  );
}
