import { Cloud, Database, FileCheck2, Globe2, Mail, Server, ShieldCheck, Zap } from "lucide-react";

const knownIconKeys = new Set(["server", "cloud", "globe", "mail", "shield", "database", "certificate", "zap"]);

export const categoryIconOptions = [
  { value: "server", label: "Máy chủ / VPS" },
  { value: "cloud", label: "Cloud / Hosting" },
  { value: "globe", label: "Tên miền" },
  { value: "mail", label: "Email" },
  { value: "shield", label: "Bảo mật / SSL" },
  { value: "database", label: "Cơ sở dữ liệu" },
  { value: "certificate", label: "Chứng chỉ" },
  { value: "zap", label: "Dịch vụ khác" },
] as const;

function inferIconKey(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized.includes("vps") || normalized.includes("server")) return "server";
  if (normalized.includes("hosting") || normalized.includes("cloud")) return "cloud";
  if (normalized.includes("domain")) return "globe";
  if (normalized.includes("email") || normalized.includes("mail")) return "mail";
  if (normalized.includes("ssl") || normalized.includes("security")) return "shield";
  if (normalized.includes("database") || normalized.includes("sql")) return "database";
  return "zap";
}

export function CategoryIcon({ iconKey, slug, size = 28, className }: {
  iconKey?: string | null;
  slug: string;
  size?: number;
  className?: string;
}) {
  const resolvedKey = iconKey?.trim().toLowerCase();
  const key = resolvedKey && knownIconKeys.has(resolvedKey) ? resolvedKey : inferIconKey(slug);
  const props = { "aria-hidden": true, className, size, strokeWidth: 1.7 } as const;
  if (key === "server") return <Server {...props} />;
  if (key === "cloud") return <Cloud {...props} />;
  if (key === "globe") return <Globe2 {...props} />;
  if (key === "mail") return <Mail {...props} />;
  if (key === "shield") return <ShieldCheck {...props} />;
  if (key === "database") return <Database {...props} />;
  if (key === "certificate") return <FileCheck2 {...props} />;
  return <Zap {...props} />;
}
