import Link from "next/link";
import { Container } from "./container";

const navigation = [
  ["Dịch vụ", "/services"],
  ["Bảng giá", "/pricing"],
  ["Blog", "/blog"],
  ["Giới thiệu", "/about"],
  ["Liên hệ", "/contact"],
] as const;

export function PublicHeader() {
  return (
    <header className="border-b border-line-200 bg-paper-50">
      <Container className="flex min-h-18 items-center justify-between gap-6">
        <Link href="/" className="text-xl font-bold tracking-tight text-ink-950">Mekong<span className="text-river-600">Node</span></Link>
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-6 lg:flex">
          {navigation.map(([label, href]) => <Link key={href} className="text-sm font-medium text-slate-600 hover:text-river-700" href={href}>{label}</Link>)}
        </nav>
        <Link href="/advisor" className="inline-flex min-h-11 items-center rounded-xl bg-lotus-500 px-4 text-sm font-semibold text-white hover:brightness-95">Tư vấn gói</Link>
      </Container>
    </header>
  );
}
