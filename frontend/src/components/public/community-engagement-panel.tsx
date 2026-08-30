"use client";

import { useId, useState } from "react";
import { OrderReviewFeed } from "@/components/public/order-review-feed";
import { QnaFeed } from "@/components/public/qna-feed";
import type { PublicQnA } from "@/features/content/api";

type EngagementTab = "reviews" | "qna";

export function CommunityEngagementPanel({
  initialSubjectFilter = null,
  initialReviewCategory = null,
  initialReviewPlan = null,
  onFollowUp,
}: {
  initialSubjectFilter?: string | null;
  initialReviewCategory?: string | null;
  initialReviewPlan?: string | null;
  onFollowUp?: (item: PublicQnA) => void;
}) {
  const [activeTab, setActiveTab] = useState<EngagementTab>("reviews");
  const tabId = useId();

  return <section className="w-full min-w-0" aria-label="Đánh giá khách hàng và cộng đồng hỏi đáp">
    <div className="mb-7 space-y-5">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0b8bd8] dark:text-[#67e8f9]">Khách hàng &amp; cộng đồng</p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-[#0f2136] dark:text-white sm:text-3xl">Góc nhìn trước khi lựa chọn dịch vụ</h2>
      </div>
      <div className="grid w-full grid-cols-2 rounded-2xl border border-[#d6ebfa] bg-[#f6fbff] p-1.5 dark:border-white/[0.08] dark:bg-[#071426]" role="tablist" aria-label="Nội dung cộng đồng">
        <button type="button" role="tab" id={`${tabId}-reviews`} aria-selected={activeTab === "reviews"} aria-controls={`${tabId}-panel`} onClick={() => setActiveTab("reviews")} className={`min-w-0 rounded-xl px-2 py-2.5 text-sm font-bold leading-snug transition-all sm:px-4 ${activeTab === "reviews" ? "bg-white text-[#0873b8] shadow-sm dark:bg-[#0e2743] dark:text-[#67e8f9]" : "text-[#6b8298] hover:text-[#0873b8] dark:text-[#8ba8c4] dark:hover:text-white"}`}>
          Đánh giá đơn
        </button>
        <button type="button" role="tab" id={`${tabId}-qna`} aria-selected={activeTab === "qna"} aria-controls={`${tabId}-panel`} onClick={() => setActiveTab("qna")} className={`min-w-0 rounded-xl px-2 py-2.5 text-sm font-bold leading-snug transition-all sm:px-4 ${activeTab === "qna" ? "bg-white text-[#0873b8] shadow-sm dark:bg-[#0e2743] dark:text-[#67e8f9]" : "text-[#6b8298] hover:text-[#0873b8] dark:text-[#8ba8c4] dark:hover:text-white"}`}>
          Hỏi đáp
        </button>
      </div>
    </div>
    <div id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${activeTab}`}>
      {activeTab === "reviews" ? <OrderReviewFeed initialCategoryFilter={initialReviewCategory} initialServicePlanFilter={initialReviewPlan} /> : <QnaFeed initialSubjectFilter={initialSubjectFilter} hideHeader onFollowUp={onFollowUp} />}
    </div>
  </section>;
}
