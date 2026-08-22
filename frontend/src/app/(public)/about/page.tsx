import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";

export default function AboutPage() { 
  return (
    <main className="relative overflow-hidden py-16 md:py-24">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-river-400/20 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/4 rounded-full bg-cyan-400/20 blur-[80px]" />

      <Container>
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <PageHeading 
            title="Về MekongNode"
            description="Nền tảng dịch vụ cloud được thiết kế theo tinh thần vận hành rõ ràng, đo được và có thể truy vết." 
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
            <Card className="relative overflow-hidden border-0 bg-white/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900/60 dark:shadow-none dark:hover:shadow-river-900/30">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-river-100 to-cyan-100 transition-transform duration-500 group-hover:scale-150 dark:from-river-900/50 dark:to-cyan-900/50" />
              <p className="relative text-5xl font-black text-river-600/20 transition-colors duration-500 group-hover:text-river-600/40">01</p>
              <h2 className="relative mt-2 text-xl font-bold tracking-tight">Hạ tầng có trách nhiệm</h2>
              <p className="relative mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Thông số, giá và trạng thái được công bố theo dữ liệu hệ thống, không dùng số liệu chưa xác minh.</p>
            </Card>
          </div>

          <div className="group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
            <Card className="relative overflow-hidden border-0 bg-white/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900/60 dark:shadow-none dark:hover:shadow-river-900/30">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 transition-transform duration-500 group-hover:scale-150 dark:from-purple-900/50 dark:to-pink-900/50" />
              <p className="relative text-5xl font-black text-purple-600/20 transition-colors duration-500 group-hover:text-purple-600/40">02</p>
              <h2 className="relative mt-2 text-xl font-bold tracking-tight">Bảo mật mặc định</h2>
              <p className="relative mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Khu vực quản trị có JWT, refresh rotation, role Admin/Editor, PBKDF2 và audit log.</p>
            </Card>
          </div>

          <div className="group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
            <Card className="relative overflow-hidden border-0 bg-white/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900/60 dark:shadow-none dark:hover:shadow-river-900/30">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 transition-transform duration-500 group-hover:scale-150 dark:from-emerald-900/50 dark:to-teal-900/50" />
              <p className="relative text-5xl font-black text-emerald-600/20 transition-colors duration-500 group-hover:text-emerald-600/40">03</p>
              <h2 className="relative mt-2 text-xl font-bold tracking-tight">Hỗ trợ thực tế</h2>
              <p className="relative mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Mỗi yêu cầu có mã tra cứu, người xử lý và trạng thái rõ ràng từ lúc tiếp nhận đến hoàn tất.</p>
            </Card>
          </div>
        </div>

        <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700 fill-mode-both">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-2xl dark:from-slate-800 dark:to-slate-950 sm:p-12">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold text-white sm:text-3xl">SLA và datacenter</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">MekongNode đặt mục tiêu uptime <span className="font-bold text-cyan-400">99.9%</span> cho các gói phù hợp. Các chứng chỉ, vị trí datacenter và cam kết chi tiết cần được cập nhật từ nguồn vận hành đã xác minh trước khi công bố chính thức.</p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  ); 
}
