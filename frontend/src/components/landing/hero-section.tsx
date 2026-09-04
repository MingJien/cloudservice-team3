import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Check,
  Gauge,
  Server,
  ShieldCheck,
} from "lucide-react";
import { HeroCopyCarousel } from "@/components/landing/hero-copy-carousel";
import { AnimatedCounter } from "@/components/ui/animated-counter";

type HeroMetricSignal = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  detail: string;
  icon: typeof Server;
};

const heroMetricSignals: readonly HeroMetricSignal[] = [
  {
    value: 5280,
    suffix: "+",
    label: "Workload kiểm thử",
    detail: "Năng lực mở rộng theo kịch bản",
    icon: Server,
  },
  {
    value: 99.98,
    suffix: "%",
    decimals: 2,
    label: "Mục tiêu SLA demo",
    detail: "Chưa phải cam kết vận hành thật",
    icon: ShieldCheck,
  },
  {
    value: 24,
    suffix: "/7",
    label: "Vòng giám sát mô phỏng",
    detail: "Luồng phản ứng theo ngưỡng",
    icon: Activity,
  },
  {
    value: 12,
    prefix: "< ",
    suffix: "ms",
    label: "Độ trễ kịch bản nội địa",
    detail: "Mốc thiết kế cần được đo tải",
    icon: Gauge,
  },
] as const;

export function HeroSection() {
  return (
    <section className="masterpiece-hero relative -mt-[7.25rem] min-h-[min(900px,100svh)] overflow-hidden bg-[#f4faff] pb-20 pt-[calc(7.25rem+5rem)] text-[#07101f] transition-colors duration-300 sm:pt-[calc(7.25rem+6.5rem)] lg:pb-24 lg:pt-[calc(7.25rem+3.5rem)] dark:bg-[#07101f] dark:text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="masterpiece-hero-image object-cover object-[58%_44%]"
        />
        <div className="hero-atmosphere-horizontal absolute inset-0" />
        <div className="hero-atmosphere-vertical absolute inset-0" />
        <div className="masterpiece-hero-grid absolute inset-0 opacity-20 dark:opacity-10" />
        <div className="hero-aurora hero-aurora-cyan" />
        <div className="hero-aurora hero-aurora-violet" />
        <div className="hero-vignette absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(390px,.8fr)] lg:items-center lg:gap-12 lg:px-8">
        <div className="hero-copy-enter max-w-3xl">
          <HeroCopyCarousel />

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/advisor"
              className="glow-btn group inline-flex min-h-13 items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:outline-white"
            >
              So sánh cấu hình
              <ArrowRight size={17} strokeWidth={2.2} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-[#d2e3ee] bg-white/82 px-6 py-3 text-sm font-semibold text-[#10283f] shadow-[0_14px_30px_-24px_rgba(7,64,103,.5),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-[#a9cfe5] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087ac1] dark:border-white/14 dark:bg-white/[0.055] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,.06)] dark:hover:border-white/25 dark:hover:bg-white/[0.09] dark:focus-visible:outline-white"
            >
              Tính thử chi phí
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 border-t border-[#d5e5f0] pt-6 sm:grid-cols-3 dark:border-white/10">
            {["Giá lấy từ API", "Tham chiếu ISO 27001", "RBAC Admin / Editor"].map((label) => (
              <div key={label} className="flex items-center gap-2.5 text-sm font-medium text-[#405a72] dark:text-[#c8d6e8]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#0b8bd8]/25 bg-[#0b8bd8]/10 text-[#087ac1] dark:border-[#67e8f9]/25 dark:bg-[#67e8f9]/10 dark:text-[#67e8f9]">
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-telemetry-enter relative mx-auto w-full max-w-[31.5rem] lg:mx-0 lg:justify-self-end">
          <div className="hero-telemetry-glow absolute -inset-8" aria-hidden="true" />
          <div className="hero-telemetry-frame relative">
            <aside className="hero-telemetry-board relative overflow-hidden rounded-[23px] border border-white/[0.16] p-4 backdrop-blur-2xl sm:p-5" aria-label="Số liệu telemetry mô phỏng">
              <div className="hero-primary-signal relative z-10 overflow-hidden rounded-[1.25rem] border border-[#67e8f9]/25 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9faff]">Lưu lượng xử lý mô phỏng hôm nay</p>
                  <span className="rounded-full border border-[#34d399]/25 bg-[#34d399]/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#a7f3d0]">
                    Live data stream
                  </span>
                </div>
                <p className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1 font-mono leading-none tabular-nums">
                  <AnimatedCounter
                    value={14_850_290}
                    suffix="+"
                    duration={4000}
                    liveTicker
                    respectReducedMotion={false}
                    className="hero-primary-number text-[clamp(2.1rem,4.7vw,3.45rem)] font-bold tracking-[-0.075em] text-slate-900 dark:text-white"
                    ariaLabel="Lưu lượng xử lý mô phỏng hôm nay: 14,850,290 yêu cầu trở lên"
                  />
                  <span className="pb-1 text-xs font-bold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">requests</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="hero-kpi-strip relative z-10 mx-auto mt-14 w-[calc(100%-2.5rem)] max-w-7xl rounded-[1.75rem] border px-5 py-8 sm:w-[calc(100%-3rem)] sm:px-8 lg:mt-16 lg:px-10 lg:py-10">
        <div className="mb-6 flex flex-col justify-between gap-3 border-b border-[#d9e9f2] pb-5 sm:flex-row sm:items-center dark:border-white/[0.08]">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#0873b8] dark:text-cyan-300">Trust &amp; scale · bản trình diễn</p>
            <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#10283f] dark:text-white">Các mốc dùng để kiểm chứng giao diện và luồng dữ liệu</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {heroMetricSignals.map(({ value, prefix, suffix, decimals, label, detail, icon: Icon }) => (
            <article key={label} className="hero-kpi-card group min-w-0 rounded-2xl border p-4 text-left sm:p-5">
              <span className="hero-kpi-icon grid h-9 w-9 place-items-center rounded-xl border">
                <Icon size={16} aria-hidden="true" />
              </span>
              <p className="mt-5 pr-2 whitespace-nowrap font-mono text-[clamp(1.75rem,3.4vw,2.7rem)] font-bold leading-none tracking-[-0.07em] tabular-nums">
                <AnimatedCounter
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={4000}
                  respectReducedMotion={false}
                  className="hero-kpi-value"
                  ariaLabel={`${prefix ?? ""}${value}${suffix ?? ""} — ${label}`}
                />
              </p>
              <p className="mt-3 text-xs font-bold text-[#18344d] sm:text-sm dark:text-slate-100">{label}</p>
              <p className="mt-1 hidden text-[0.68rem] leading-5 text-[#6b7f93] sm:block dark:text-slate-400">{detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#f4faff] to-transparent dark:from-[#07101f]" aria-hidden="true" />
    </section>
  );
}
