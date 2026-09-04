"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicQnAs, type PublicQnA } from "@/features/content/api";
import { Pagination } from "@/components/ui/pagination";
import { ResponderBadge } from "@/components/public/responder-badge";

function displayDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function QnaFeed({ initialSubjectFilter = null, hideHeader = false, onFollowUp }: { initialSubjectFilter?: string | null, hideHeader?: boolean, onFollowUp?: (item: PublicQnA) => void }) {
  const [qnaList, setQnaList] = useState<PublicQnA[]>([]);
  const [qnaPage, setQnaPage] = useState(1);
  const [qnaTotalPages, setQnaTotalPages] = useState(1);
  const [qnaLoading, setQnaLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(initialSubjectFilter);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubjectFilter(initialSubjectFilter);
  }, [initialSubjectFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQnaLoading(true);
    let query = `pageNumber=${qnaPage}&pageSize=10`;
    if (subjectFilter) {
      query += `&subject=${encodeURIComponent(subjectFilter)}`;
    }
    getPublicQnAs(query)
      .then(res => {
        setQnaList(res.items);
        setQnaTotalPages(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setQnaLoading(false));
  }, [qnaPage, subjectFilter]);

  return (
    <div className="w-full">
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-bold text-[#0f2136] dark:text-white flex items-center gap-3">
            Cộng đồng Hỏi Đáp
            {subjectFilter && (
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0b8bd8] to-[#0873b8] px-3.5 py-1.5 text-sm font-bold text-white shadow-md shadow-[#0b8bd8]/20">
                {subjectFilter}
                <button onClick={() => { setSubjectFilter(null); setQnaPage(1); }} className="hover:text-white/70 transition-colors ml-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </span>
            )}
          </h2>
        </div>
      )}

      <div className="space-y-6">
        {qnaLoading ? (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white/60 dark:bg-slate-800/60" />
            ))}
          </div>
        ) : qnaList.length === 0 ? (
          <div className="py-20 text-center bg-white/50 dark:bg-[#071426]/50 rounded-3xl border border-dashed border-[#bce0f8] dark:border-white/10 backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#f0f8ff] dark:bg-white/5 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#8ba8c4]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <p className="text-[#5a7b9c] font-medium text-lg">Chưa có câu hỏi nào {subjectFilter ? `cho chủ đề ${subjectFilter}` : "được giải đáp"}.</p>
            <p className="text-[#8ba8c4] text-sm mt-2">Hãy là người đầu tiên đặt câu hỏi cho Đội ngũ!</p>
          </div>
        ) : (
          <>
            {qnaList.map((item) => (
              <article key={item.id} className="group relative rounded-3xl bg-white dark:bg-[#0a192f] shadow-lg shadow-[#0b8bd8]/5 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-[#e6f2fb] dark:border-white/[0.03] overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#bce0f8] dark:hover:border-white/10 hover:-translate-y-1">
                {/* Question */}
                <div className="p-6 sm:p-7">
                  <div className="flex items-start gap-5">
                    <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f9fd] to-[#e6f2fb] text-[#0b8bd8] dark:from-[#0d223f] dark:to-[#09152a] dark:text-[#38bdf8] border border-[#d6ebfa] dark:border-white/5 font-bold text-lg uppercase shadow-inner">
                      {item.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <span className="font-bold text-[#0f2136] dark:text-white text-[1.05rem]">{item.fullName}</span>
                      </div>
                      <button
                        onClick={() => { setSubjectFilter(item.subject); setQnaPage(1); }}
                        className="inline-flex items-center rounded-xl bg-[#f0f8ff] hover:bg-[#e6f4ff] border border-[#d6ebfa] dark:bg-[#132a42] dark:hover:bg-[#1a3654] dark:border-white/5 px-3 py-1 text-xs font-bold text-[#0b8bd8] dark:text-[#38bdf8] transition-all shadow-sm active:scale-95 mb-4"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                        {item.subject}
                      </button>
                      <p className="text-[#334e68] dark:text-[#bcccdc] text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap font-medium">{item.message}</p>
                    </div>
                  </div>
                </div>

                {/* Answer */}
                {item.adminReply && (
                  <div className="bg-gradient-to-b from-[#f9fcff] to-[#f4f9fd] dark:from-[#071324] dark:to-[#050e1b] p-6 sm:p-7 border-t border-[#e6f2fb] dark:border-white/[0.03] relative">
                    <div className="absolute left-7 sm:left-[3.25rem] top-0 bottom-8 w-0.5 bg-gradient-to-b from-[#bce0f8] to-transparent dark:from-[#0b8bd8]/30" />
                    <div className="flex items-start gap-5 relative z-10">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#0f2136] to-[#1a3654] dark:from-white dark:to-slate-200 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-[#0a192f]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-[#0f2136]">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center gap-3 mb-2.5">
                          <ResponderBadge role={item.repliedByRole} className="text-xs uppercase tracking-wider" />
                          {item.repliedAt && <span className="text-xs font-semibold text-[#8ba8c4] uppercase tracking-widest">&bull; {displayDate(item.repliedAt)}</span>}
                        </div>
                        <p className="text-[#1e3a5a] dark:text-[#e2e8f0] text-base leading-relaxed whitespace-pre-wrap font-medium">{item.adminReply}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          {onFollowUp ? (
                            <button
                              type="button"
                              onClick={() => onFollowUp(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#bce0f8] bg-white px-4 py-2 text-sm font-bold text-[#0873b8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0b8bd8] hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-[#67e8f9] dark:hover:border-[#22d3ee]/50"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                              Hỏi tiếp về câu này
                            </button>
                          ) : (
                            <Link
                              href={`/contact?replyTo=${item.id}&subject=${encodeURIComponent(item.subject)}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#bce0f8] bg-white px-4 py-2 text-sm font-bold text-[#0873b8] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0b8bd8] hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:text-[#67e8f9] dark:hover:border-[#22d3ee]/50"
                            >
                              Hỏi tiếp về câu này
                            </Link>
                          )}
                          <span className="text-xs font-medium text-[#6b8298] dark:text-[#8ba8c4]">Câu hỏi mới sẽ chờ kiểm duyệt trước khi công khai.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {item.followUps.length > 0 && (
                  <div className="border-t border-[#e6f2fb] bg-[#f7fbfe]/80 px-6 py-6 sm:px-7 dark:border-white/[0.04] dark:bg-[#06111f]/75">
                    <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#5a7b9c] dark:text-[#8ba8c4]">
                      Trao đổi tiếp · {item.followUps.length}
                    </p>
                    <div className="space-y-4">
                      {item.followUps.map((followUp) => (
                        <div key={followUp.id} className="rounded-2xl border border-[#dcecf7] bg-white/85 p-4 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.035]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-sm text-[#17324d] dark:text-white">{followUp.fullName}</strong>
                            <time className="text-[11px] font-semibold uppercase tracking-wider text-[#8ba8c4]">{displayDate(followUp.createdAt)}</time>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#466585] dark:text-[#bcccdc]">{followUp.message}</p>
                          <div className="mt-3 rounded-xl border-l-2 border-[#0b8bd8] bg-[#edf8ff] px-4 py-3 dark:border-[#22d3ee] dark:bg-[#0b8bd8]/10">
                            <ResponderBadge role={followUp.repliedByRole} className="text-[11px] uppercase tracking-[0.12em] text-[#0873b8] dark:text-[#67e8f9]" />
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#1e3a5a] dark:text-[#e2e8f0]">{followUp.adminReply}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
            <div className="pt-6">
              <Pagination
                pageNumber={qnaPage}
                totalPages={qnaTotalPages}
                onPageChange={setQnaPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
