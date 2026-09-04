import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";
const variants: Record<BadgeVariant, string> = {
  neutral: "bg-slate-600/10 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  info: "bg-ice-100 text-river-700 dark:bg-river-500/20 dark:text-accent-cyan dark:shadow-[0_0_12px_rgba(34,211,238,0.2)]",
  success: "bg-success-600/10 text-success-600 dark:bg-accent-emerald/20 dark:text-accent-emerald dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  warning: "bg-warning-600/10 text-warning-600 dark:bg-accent-amber/20 dark:text-accent-amber dark:shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  danger: "bg-danger-600/10 text-danger-600 dark:bg-danger-600/20 dark:text-danger-600 dark:shadow-[0_0_12px_rgba(184,58,75,0.2)]",
};

export function Badge({ className, variant = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold transition-all", variants[variant], className)} {...props} />;
}
