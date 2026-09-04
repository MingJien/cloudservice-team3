import { Activity, Boxes, Gauge, ShieldCheck } from "lucide-react";

const stats = [
  { icon: Boxes, value: ".NET 10", label: "Backend Clean Architecture", detail: "Domain độc lập, dependency đi vào trong" },
  { icon: Gauge, value: "REST L2", label: "API tài nguyên & trạng thái", detail: "Phân trang, lọc và Problem Details" },
  { icon: Activity, value: "99,9%", label: "Mục tiêu SLA mô phỏng", detail: "Chỉ trở thành cam kết khi có đo lường thật" },
  { icon: ShieldCheck, value: "Audit", label: "Dấu vết quản trị", detail: "Vai trò, refresh rotation và nhật ký thay đổi" },
] as const;

export function AboutStats() {
  return (
    <section className="relative z-10 -mt-2 grid overflow-hidden rounded-[1.7rem] border border-[#cfe3ef] bg-white/90 shadow-[0_26px_70px_-48px_rgba(7,64,103,.65),inset_0_1px_0_rgba(255,255,255,.96)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10 dark:bg-[#0b182b]/88 dark:shadow-[0_30px_80px_-45px_rgba(0,0,0,.95)]">
      {stats.map(({ icon: Icon, value, label, detail }, index) => (
        <article key={label} className={`group relative p-6 transition-colors hover:bg-[#f3fbff] dark:hover:bg-cyan-300/[0.035] ${index > 0 ? "border-t border-[#dfedf5] sm:border-t-0 sm:border-l dark:border-white/[0.07]" : ""} ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[1.65rem] font-bold tracking-[-0.045em] text-[#075f9d] dark:text-cyan-300">{value}</span>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#cfe4f1] bg-[#f4fbff] text-[#0873b8] transition-transform group-hover:-translate-y-0.5 dark:border-cyan-300/15 dark:bg-cyan-300/[0.07] dark:text-cyan-300"><Icon size={18} /></span>
          </div>
          <h2 className="mt-4 text-sm font-bold text-[#112a43] dark:text-white">{label}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
        </article>
      ))}
    </section>
  );
}
