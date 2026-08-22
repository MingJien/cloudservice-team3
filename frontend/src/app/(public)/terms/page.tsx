import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Phạm vi và nguyên tắc sử dụng bản demo nền tảng MekongNode CloudService.",
};

const terms = [
  ["Phạm vi bản demo", "MekongNode CloudService là sản phẩm học tập mô phỏng quy trình giới thiệu, báo giá, tiếp nhận và quản lý yêu cầu dịch vụ cloud. Hệ thống không tự động provisioning hạ tầng hoặc xử lý thanh toán."],
  ["Giá và khuyến mãi", "Giá hiển thị được tính tại backend theo gói, chu kỳ và quy tắc khuyến mãi. Trong bản demo, đây là dữ liệu minh họa và không tạo thành cam kết thương mại."],
  ["Yêu cầu hợp lệ", "Người dùng không gửi dữ liệu giả mạo, mã độc, nội dung xâm phạm quyền của người khác hoặc thực hiện hành vi phá hoại, dò quét và vượt kiểm soát truy cập."],
  ["SLA và giới hạn", "Các chỉ số SLA, uptime, khách hàng và chứng chỉ chỉ là mục tiêu hoặc dữ liệu demo khi chưa có nguồn xác minh. Hợp đồng thật cần quy định riêng về SLA, bồi thường, backup và hỗ trợ."],
] as const;

export default function TermsPage() {
  return (
    <main className="bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.1),transparent_34%)] py-16 dark:bg-[#07101f] md:py-24">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-river-700 dark:text-cyan-300">Service agreement</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl">Điều khoản sử dụng</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">Phạm vi rõ ràng cho bản demo CloudService. Cập nhật lần cuối: 20/08/2026.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {terms.map(([title, content]) => (
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
