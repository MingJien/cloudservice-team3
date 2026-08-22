import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

type HeroMetricSignal = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
};

const heroMetricSignals: readonly HeroMetricSignal[] = [
  {
    value: 5280,
    suffix: "+",
    label: "Workload kiểm thử",
  },
  {
    value: 99.98,
    suffix: "%",
    decimals: 2,
    label: "Mục tiêu SLA demo",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Vòng giám sát mô phỏng",
  },
  {
    value: 12,
    prefix: "< ",
    suffix: "ms",
    label: "Độ trễ kịch bản nội địa",
  },
] as const;

export function HeroSection() {
  return (
    <section className="masterpiece-hero relative -mt-[7.25rem] min-h-[min(900px,100svh)] overflow-hidden bg-[#f4faff] pb-20 pt-[calc(7.25rem+5rem)] text-[#07101f] transition-colors duration-300 sm:pt-[calc(7.25rem+6.5rem)] lg:pb-24 lg:pt-[calc(7.25rem+2.75rem)] dark:bg-[#07101f] dark:text-white">
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
        <div className="masterpiece-hero-grid absolute inset-0 opacity-55" />
        <div className="hero-aurora hero-aurora-cyan" />
        <div className="hero-aurora hero-aurora-violet" />
        <div className="hero-vignette absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(390px,.8fr)] lg:items-center lg:gap-12 lg:px-8">
        <div className="hero-copy-enter max-w-3xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#cce2ef] bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_12px_34px_-24px_rgba(7,95,157,.38)] backdrop-blur-xl dark:border-[#7dd3fc]/20 dark:bg-[#071426]/68 dark:shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_12px_40px_rgba(2,8,23,.28)]">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#67e8f9] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#67e8f9]" />
            </span>
            <span className="text-[0.69rem] font-semibold uppercase tracking-[0.17em] text-[#075f9d] sm:text-xs dark:text-[#bae6fd]">
              MekongNode · Đồ án Cloud/VPS
            </span>
          </div>

          <h1 className="mt-7 max-w-[13ch] text-[clamp(2.7rem,5.2vw,4.75rem)] font-bold leading-[1.04] tracking-[-0.052em] text-[#07101f] dark:text-white">
            Chọn cloud vừa nhu cầu.
            <span className="hero-headline-gradient block pb-1">Giá đúng dữ liệu.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base font-normal leading-8 text-[#4b6077] sm:text-lg sm:leading-9 dark:text-[#b9c8dd]">
            MekongNode là đồ án nhóm mô phỏng quy trình mua VPS/Hosting tại Việt Nam. Thông số được
            chuẩn hóa để dễ so sánh, giá tính tại backend và mỗi yêu cầu có mã tra cứu riêng.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/advisor"
              className="hero-primary-cta group inline-flex min-h-13 items-center justify-center gap-2.5 rounded-2xl px-6 py-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#087ac1] dark:text-[#06111f] dark:focus-visible:outline-[#67e8f9]"
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
            {["Giá lấy từ API", "Mã tra cứu riêng", "Quản trị theo vai trò"].map((label) => (
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
                    className="hero-primary-number text-[clamp(2.1rem,4.7vw,3.45rem)] font-bold tracking-[-0.075em]"
                    ariaLabel="Lưu lượng xử lý mô phỏng hôm nay: 14,850,290 yêu cầu trở lên"
                  />
                  <span className="pb-1 text-xs font-bold uppercase tracking-[0.13em] text-[#a5f3fc]">requests</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="hero-kpi-strip relative z-10 mx-auto mt-14 w-[calc(100%-2.5rem)] max-w-7xl rounded-[1.75rem] border px-5 py-8 sm:w-[calc(100%-3rem)] sm:px-8 lg:mt-16 lg:px-10 lg:py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-[#d8e5ef] dark:lg:divide-white/10">
          {heroMetricSignals.map(({ value, prefix, suffix, decimals, label }) => (
            <article key={label} className="min-w-0 text-center lg:px-5">
              <p className="hero-kpi-value whitespace-nowrap font-mono text-[clamp(2rem,4vw,3.25rem)] font-bold leading-none tracking-[-0.07em] tabular-nums">
                <AnimatedCounter
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                  duration={4000}
                  respectReducedMotion={false}
                  ariaLabel={`${prefix ?? ""}${value}${suffix ?? ""} — ${label}`}
                />
              </p>
              <p className="mt-3 text-xs font-medium text-[#64748b] sm:text-sm dark:text-[#a9b8cc]">{label}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#f4faff] to-transparent dark:from-[#07101f]" aria-hidden="true" />
    </section>
  );
}
