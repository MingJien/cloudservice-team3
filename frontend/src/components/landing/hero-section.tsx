import Link from "next/link";
import { Container } from "@/components/layout/container";

export function HeroSection() {
  return (
    <section className="bg-ink-950 py-16 text-white md:py-24">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-ice-100">MekongNode starter</p><h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">Nền tảng rõ ràng cho dịch vụ cloud doanh nghiệp</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/70">Hero đang giữ chỗ cho Gói B. Nội dung, dữ liệu và lời hứa thương hiệu phải được chủ module duyệt trước khi hoàn thiện.</p><div className="mt-7 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-xl bg-river-600 px-5 font-semibold" href="/services">Xem route dịch vụ</Link><Link className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 font-semibold" href="/contact">Route liên hệ</Link></div></div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6"><p className="text-sm font-semibold">Infrastructure panel placeholder</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/10 p-4 text-sm text-white/65">Không bịa uptime/chứng chỉ</div><div className="rounded-xl border border-white/10 p-4 text-sm text-white/65">Không dùng ảnh cloud 3D</div></div></div>
      </Container>
    </section>
  );
}
