import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-[1.35rem] border border-[#d5e5f0] bg-white p-6 shadow-[0_22px_55px_-38px_rgba(7,64,103,.42),inset_0_1px_0_rgba(255,255,255,.96)] transition-all dark:border-white/[0.09] dark:bg-[#0d1b32]/90 dark:shadow-[0_26px_60px_-38px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.055)]", className)} {...props} />;
}
