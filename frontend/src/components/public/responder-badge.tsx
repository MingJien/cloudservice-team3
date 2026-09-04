import { BadgeCheck } from "lucide-react";
import type { ContactResponderRole } from "@/features/content/api";
import { cn } from "@/lib/cn";

interface ResponderBadgeProps {
  role: ContactResponderRole | null;
  className?: string;
}

export function ResponderBadge({ role, className }: ResponderBadgeProps) {
  // Legacy replies created before role snapshots existed are shown as brand
  // replies; we must not attribute an old answer to a specialist by guessing.
  const label = role === "Editor" ? "Đội ngũ chuyên gia" : "MeKong Node";

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-bold text-[#0f2136] dark:text-white", className)}>
      {label}
      <BadgeCheck size={16} strokeWidth={2.4} className="shrink-0 fill-emerald-500 text-white dark:text-[#07101f]" aria-label="Tài khoản đã xác minh" />
    </span>
  );
}
