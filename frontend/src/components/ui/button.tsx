import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border border-transparent bg-[linear-gradient(115deg,#054b7b_0%,#075f9d_52%,#087ac1_100%)] text-white shadow-[0_14px_28px_-16px_rgba(11,139,216,.78),inset_0_1px_0_rgba(255,255,255,.24)] hover:-translate-y-0.5 hover:saturate-110 hover:shadow-[0_18px_34px_-16px_rgba(11,139,216,.9)]",
  secondary: "border border-[#d2e2ed] bg-white text-[#10283f] shadow-[0_10px_24px_-22px_rgba(7,64,103,.5)] hover:-translate-y-0.5 hover:border-[#9bc8e2] hover:bg-[#f2faff] dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:hover:border-[#67e8f9]/45 dark:hover:bg-white/[0.09] dark:hover:shadow-[0_0_18px_rgba(34,211,238,.14)]",
  danger: "bg-danger-600 text-white hover:brightness-110 hover:shadow-[0_0_20px_rgba(184,58,75,0.4)] border border-transparent",
  ghost: "bg-transparent text-river-700 hover:bg-ice-100 dark:text-accent-cyan dark:hover:bg-white/5",
};

export function Button({ className, variant = "primary", isLoading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river-600 dark:focus-visible:outline-accent-cyan disabled:cursor-not-allowed disabled:opacity-55 active:scale-95",
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Đang xử lý..." : children}
    </button>
  );
}
