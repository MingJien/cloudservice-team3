import Link from "next/link";
import { Container } from "./container";
import { BrandLockup } from "@/components/brand/logo";

function IconMail() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function PublicFooter() {
  return (
    <footer className="relative bg-ink-950 pt-16 pb-8 text-white">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-river-600 to-transparent opacity-50" />
      
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-river-900 rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <Container className="relative z-10 grid gap-12 lg:grid-cols-4 md:grid-cols-2">
        {/* Brand Column */}
        <div className="lg:col-span-1">
          <Link href="/" className="group" aria-label="MekongNode - Trang chủ">
            <BrandLockup
              markClassName="h-10 w-10 transition-transform duration-300 group-hover:scale-[1.06]"
              nameClassName="text-xl"
              tone="on-dark"
            />
          </Link>
          <p className="mt-4 text-sm leading-6 text-white/60">
            Đồ án nhóm về nền tảng Cloud/VPS: danh mục dịch vụ, báo giá từ API, advisor theo luật và quản trị theo vai trò.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <Link href="/contact" className="text-white/40 hover:text-white transition-colors" aria-label="Liên hệ MekongNode">
              <IconMail />
            </Link>
          </div>
        </div>

        {/* Services Column */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Dịch vụ</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link href="/services?category=vps" className="hover:text-accent-cyan transition-colors">Cloud Server (VPS)</Link></li>
            <li><Link href="/services?category=hosting" className="hover:text-accent-cyan transition-colors">Web Hosting</Link></li>
            <li><Link href="/services?category=domain" className="hover:text-accent-cyan transition-colors">Tên miền</Link></li>
            <li><Link href="/services?category=business-email" className="hover:text-accent-cyan transition-colors">Email doanh nghiệp</Link></li>
            <li><Link href="/services?category=ssl" className="hover:text-accent-cyan transition-colors">Bảo mật SSL</Link></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Tài nguyên</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link href="/orders/track" className="hover:text-accent-cyan transition-colors">Tra cứu đơn hàng</Link></li>
            <li><Link href="/pricing" className="hover:text-accent-cyan transition-colors">Bảng giá</Link></li>
            <li><Link href="/offers" className="hover:text-accent-cyan transition-colors">Ưu đãi đang áp dụng</Link></li>
            <li><Link href="/advisor" className="hover:text-accent-cyan transition-colors">Công cụ tư vấn</Link></li>
            <li><Link href="/blog" className="hover:text-accent-cyan transition-colors">Blog kỹ thuật</Link></li>
            <li><Link href="/order" className="hover:text-accent-cyan transition-colors">Đặt dịch vụ</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">Dự án</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            <li><Link href="/about" className="hover:text-accent-cyan transition-colors">Về chúng tôi</Link></li>
            <li><Link href="/contact" className="hover:text-accent-cyan transition-colors">Liên hệ</Link></li>
            <li><Link href="/affiliate" className="hover:text-accent-cyan transition-colors">Chương trình đối tác</Link></li>
            <li><Link href="/admin/login" className="hover:text-accent-cyan transition-colors">Đăng nhập quản trị</Link></li>
          </ul>
        </div>
      </Container>

      <Container className="relative z-10 mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <p>© {new Date().getFullYear()} MekongNode · CloudService - Nhóm 3.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white transition-colors">Quyền riêng tư</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
        </div>
      </Container>
    </footer>
  );
}
