import Link from "next/link";
import { Container } from "./container";

export function PublicFooter() {
  return (
    <footer className="bg-ink-950 py-12 text-white">
      <Container className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-lg font-bold">MekongNode</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Starter dùng chung cho website dịch vụ cloud. Nội dung kinh doanh và thông tin liên hệ sẽ do chủ module hoàn thiện.</p>
        </div>
        <nav aria-label="Liên kết cuối trang" className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/about">Giới thiệu</Link><Link href="/contact">Liên hệ</Link><Link href="/admin/login">Quản trị</Link>
        </nav>
      </Container>
    </footer>
  );
}
