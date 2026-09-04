import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Quyền riêng tư",
  description: "Nguyên tắc thu thập, sử dụng và bảo vệ dữ liệu trên nền tảng MekongNode.",
};

const sections = [
  ["Dữ liệu được tiếp nhận", "Hệ thống chỉ tiếp nhận thông tin cần cho yêu cầu tư vấn, đặt dịch vụ, liên hệ hoặc đăng ký đối tác, như họ tên, email, số điện thoại và nội dung nhu cầu."],
  ["Mục đích sử dụng", "Dữ liệu được dùng để phản hồi yêu cầu, báo giá, theo dõi tiến độ xử lý và bảo vệ tính toàn vẹn vận hành. Bản demo không thực hiện thanh toán trực tuyến."],
  ["Bảo vệ và truy cập", "Quyền quản trị được kiểm soát bằng JWT, vai trò và nhật ký audit. Mật khẩu được băm kèm salt; access token và refresh token không được lưu trong localStorage."],
  ["Quyền của người dùng", "Người dùng có thể gửi yêu cầu kiểm tra, đính chính hoặc xóa dữ liệu demo qua trang Liên hệ. Môi trường triển khai thật phải bổ sung chính sách lưu trữ và đầu mối pháp lý cụ thể."],
] as const;

export default function PrivacyPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.1),transparent_34%)] py-16 dark:bg-[#07101f] md:py-24">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-river-700 dark:text-cyan-300">Trust center</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl">Quyền riêng tư và dữ liệu</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">Nguyên tắc minh bạch cho bản demo hệ thống CloudService. Cập nhật lần cuối: 20/08/2026.</p>
          <div className="mt-10 grid gap-4">
            {sections.map(([title, content]) => (
              <section key={title} className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,.38)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] md:p-8">
                <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{content}</p>
              </section>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
