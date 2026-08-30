"use client";

import { useEffect, useState } from "react";

const COPY_ROTATION_MS = 3_000;

const heroMessages = [
  {
    eyebrow: "Cấu hình trước, báo giá sau",
    lead: "Chọn cloud vừa nhu cầu.",
    accent: "Giá đúng dữ liệu.",
    description:
      "So sánh vCPU, RAM, NVMe và băng thông trước khi đặt. Giá được tính từ hệ thống.",
  },
  {
    eyebrow: "Từ landing đến vận hành",
    lead: "Một yêu cầu. Một mã tra cứu.",
    accent: "Không mất dấu.",
    description:
      "Đơn được lưu trước khi gửi thông báo; khách theo dõi bằng mã riêng, còn đội vận hành cập nhật trạng thái từ Admin.",
  },
  {
    eyebrow: "Bảo mật có thể giải thích",
    lead: "Chức năng riêng biệt",
    accent: "Thay đổi có dấu vết.",
    description:
      "Admin và Editor có phạm vi riêng. Phiên đăng nhập, thay đổi dữ liệu và lịch sử trạng thái đều được kiểm soát.",
  },
] as const;

export function HeroCopyCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % heroMessages.length),
      COPY_ROTATION_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  const message = heroMessages[activeIndex];

  return (
    <div className="hero-copy-rotator min-h-[24rem] sm:min-h-[25.5rem]">
      <div key={message.lead} className={reduceMotion ? undefined : "hero-copy-slide-in"}>
        <div className="inline-flex items-center gap-2.5 rounded-full border border-[#cce2ef] bg-white/82 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.95),0_12px_34px_-24px_rgba(7,95,157,.38)] backdrop-blur-xl dark:border-[#7dd3fc]/20 dark:bg-[#071426]/68 dark:shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_12px_40px_rgba(2,8,23,.28)]">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#67e8f9] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22b8d4] dark:bg-[#67e8f9]" />
          </span>
          <span className="text-[0.69rem] font-semibold uppercase tracking-[0.17em] text-[#075f9d] sm:text-xs dark:text-[#bae6fd]">
            {message.eyebrow}
          </span>
        </div>

        <h1 className="mt-7 max-w-[14ch] text-[clamp(2.7rem,5.2vw,4.75rem)] font-bold leading-[1.04] tracking-[-0.052em] text-[#07101f] dark:text-white">
          {message.lead}
          <span className="block pb-1 text-[#0873b8] dark:text-cyan-300">{message.accent}</span>
        </h1>

        <p className="mt-7 max-w-2xl text-base font-normal leading-8 text-[#4b6077] sm:text-lg sm:leading-9 dark:text-[#b9c8dd]">
          {message.description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2" aria-hidden="true">
        {heroMessages.map((item, index) => (
          <span
            key={item.lead}
            className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? "w-9 bg-[#0873b8] dark:bg-cyan-300" : "w-3 bg-[#aac6d7] dark:bg-white/25"}`}
          />
        ))}
        <span className="ml-1 text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-[#6d8294] dark:text-slate-500">
          0{activeIndex + 1} / 0{heroMessages.length}
        </span>
      </div>
    </div>
  );
}
