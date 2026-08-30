"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createContact, getContactStatus } from "@/features/content/api";
import type { PublicContactStatus } from "@/features/content/api";
import type { PublicQnA } from "@/features/content/api";
import { getPlans } from "@/features/catalog/api";
import type { Plan } from "@/features/catalog/types";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { CommunityEngagementPanel } from "@/components/public/community-engagement-panel";
import { ResponderBadge } from "@/components/public/responder-badge";

const CONTACT_TICKET_KEY = "mekongnode.contact-ticket";

function statusLabel(status: PublicContactStatus["status"]) {
  if (status === "Replied") return "Đã phản hồi";
  if (status === "Read") return "Đang xử lý";
  return "Đã tiếp nhận";
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export function ContactForm() {
  const formAnchorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [followUpContext, setFollowUpContext] = useState<{ id: number; subject: string; question?: string } | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sentTrackingCode, setSentTrackingCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lookup
  const [trackingCode, setTrackingCode] = useState("");
  const [ticket, setTicket] = useState<PublicContactStatus | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Plans
  const [plans, setPlans] = useState<Plan[]>([]);



  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, phone: digits }));
  }

  const phoneValidation = useMemo(() => {
    if (!form.phone) return { error: undefined };
    if (!form.phone.startsWith("0")) return { error: "Số điện thoại phải bắt đầu bằng số 0 (ví dụ: 0912345678)." };
    if (!phoneFocused && form.phone.length > 0 && form.phone.length < 10) return { error: "Vui lòng nhập đủ 10 chữ số." };
    return { error: undefined };
  }, [form.phone, phoneFocused]);

  function rememberTicket(item: PublicContactStatus) {
    setTicket(item);
    setTrackingCode(item.trackingCode);
    window.localStorage.setItem(CONTACT_TICKET_KEY, item.trackingCode);
    window.history.replaceState(null, "", `/contact?ticket=${item.trackingCode}`);
  }

  // Initial loads
  useEffect(() => {
    getPlans("pageNumber=1&pageSize=100")
      .then(res => {
        setPlans(res.items);
        if (res.items.length > 0) {
          setForm(f => ({ ...f, subject: f.subject || res.items[0].name }));
        }
      })
      .catch(console.error);

    const searchParams = new URLSearchParams(window.location.search);
    const replyTo = Number(searchParams.get("replyTo"));
    const replySubject = searchParams.get("subject")?.trim();
    if (Number.isSafeInteger(replyTo) && replyTo > 0 && replySubject) {
      // URL context is an external navigation input synchronized once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFollowUpContext({ id: replyTo, subject: replySubject });
      setForm(current => ({ ...current, subject: replySubject }));
    }

    const queryCode = searchParams.get("ticket");
    const savedCode = window.localStorage.getItem(CONTACT_TICKET_KEY);
    const code = (queryCode || savedCode || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{10,50}$/.test(code)) return;

    let active = true;
    getContactStatus(code)
      .then((result) => {
        if (active) {
          setTicket(result);
          setTrackingCode(result.trackingCode);
        }
      })
      .catch(() => { if (active && queryCode) setLookupError("Mã liên hệ không hợp lệ hoặc không còn tồn tại."); });
    return () => { active = false; };
  }, []);



  // Polling ticket
  useEffect(() => {
    if (!ticket || ticket.status === "Replied") return;
    const timer = window.setInterval(() => {
      getContactStatus(ticket.trackingCode)
        .then((result) => setTicket(result))
        .catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [ticket]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.phone && !/^0\d{9}$/.test(form.phone)) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createContact({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || (plans[0]?.name ?? "Liên hệ"),
        message: form.message.trim(),
        parentContactRequestId: followUpContext?.id,
      });
      setSentTrackingCode(result.trackingCode);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi liên hệ.");
    } finally {
      setLoading(false);
    }
  }

  async function lookup(event?: FormEvent) {
    event?.preventDefault();
    const code = trackingCode.trim().toUpperCase();
    if (!/^[A-Z0-9-]{10,50}$/.test(code)) {
      setLookupError("Mã liên hệ không hợp lệ. Vui lòng dán chính xác mã REQ-...");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    try {
      rememberTicket(await getContactStatus(code));
    } catch (caught) {
      setTicket(null);
      setLookupError(caught instanceof Error ? caught.message : "Không thể tra cứu phản hồi.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function copyTrackingCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function startFollowUp(item: PublicQnA) {
    setSentTrackingCode(null);
    setError("");
    setFollowUpContext({ id: item.id, subject: item.subject, question: item.message });
    setForm(current => ({ ...current, subject: item.subject, message: "" }));
    window.history.replaceState(null, "", `/contact?replyTo=${item.id}&subject=${encodeURIComponent(item.subject)}`);
    window.setTimeout(() => formAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function cancelFollowUp() {
    setFollowUpContext(null);
    setForm(current => ({ ...current, message: "", subject: plans[0]?.name ?? "" }));
    window.history.replaceState(null, "", "/contact");
  }

  return (
    <main className="py-12 md:py-16 relative overflow-hidden bg-slate-50 dark:bg-[#040f1a]">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#e0f0fd] to-transparent dark:from-[#0b2847] pointer-events-none -z-10" />
      <Container>
        <PageHeading
          title="Hỏi đáp & Liên hệ"
          description="Gửi nhu cầu triển khai, câu hỏi kỹ thuật về các gói dịch vụ hoặc tham khảo câu trả lời từ cộng đồng."
        />

        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">

          {/* Left Column: Form & Lookup */}
          <div ref={formAnchorRef} className="lg:col-span-5 grid gap-8 scroll-mt-28">
            <Card className="shadow-2xl shadow-[#a3c9e8]/30 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/50 ring-1 ring-[#cce0ef] dark:ring-white/10 bg-white/70 dark:bg-[#071426]/70 backdrop-blur-3xl overflow-hidden rounded-3xl p-1">
              {sentTrackingCode ? (
                <div className="py-10 text-center px-6">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-inner">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0f2136] dark:text-white tracking-tight">Gửi yêu cầu thành công</h3>
                  <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-[#f0f8ff] to-[#e6f4ff] dark:from-[#0a1e35] dark:to-[#0d2644] border border-[#d6ebfa] dark:border-white/5 shadow-inner">
                    <p className="text-sm font-semibold text-[#5a7b9c] dark:text-[#8ba8c4] mb-3 uppercase tracking-wider">Mã tra cứu của bạn</p>
                    <div className="flex items-center justify-center gap-3">
                      <strong className="font-mono text-xl text-[#0b8bd8] dark:text-[#38bdf8] tracking-widest">{sentTrackingCode}</strong>
                      <button
                        onClick={() => copyTrackingCode(sentTrackingCode)}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#132a42] text-[#0b8bd8] dark:text-[#38bdf8] hover:bg-[#e6f4ff] dark:hover:bg-[#1c3a5a] transition-all shadow-sm active:scale-95 group relative"
                        title="Sao chép mã"
                      >
                        {copied ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        )}
                        {copied && <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0f2136] text-white text-xs py-1 px-2.5 rounded-md font-medium whitespace-nowrap shadow-lg">Đã copy!</span>}
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[#466585] dark:text-[#a0bacf] leading-relaxed">
                    Bạn có thể dùng mã này để kiểm tra phản hồi riêng tư từ đội ngũ (nếu câu hỏi có chứa thông tin mật).
                  </p>
                  <div className="mt-8 flex justify-center gap-3">
                    <Button variant="secondary" onClick={() => { setSentTrackingCode(null); setForm(f => ({ ...f, message: "" })); }} className="rounded-xl px-6">
                      Hỏi câu khác
                    </Button>
                    <Link href={`/contact?ticket=${sentTrackingCode}`} passHref legacyBehavior>
                      <Button className="rounded-xl px-6 bg-gradient-to-r from-[#0b8bd8] to-[#0873b8] hover:from-[#0a7bc0] hover:to-[#07629c]">Tra cứu ngay</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="grid gap-6 p-6 sm:p-8" onSubmit={submit}>
                  <div className="mb-2 text-center">
                    <h2 className="text-2xl font-bold text-[#0f2136] dark:text-white tracking-tight">{followUpContext ? "Hỏi tiếp theo ngữ cảnh" : "Đặt câu hỏi mới"}</h2>
                    <p className="text-sm font-medium text-[#5a7b9c] dark:text-[#8ba8c4] mt-2">Câu trả lời chỉ xuất hiện công khai sau khi đội ngũ kiểm duyệt; email và số điện thoại luôn được giữ riêng tư.</p>
                  </div>
                  {error && <ErrorState description={error} />}

                  {followUpContext && (
                    <div className="rounded-2xl border border-[#bce0f8] bg-[#edf8ff] p-4 text-left dark:border-[#22d3ee]/25 dark:bg-[#0b8bd8]/10">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0873b8] dark:text-[#67e8f9]">Đang hỏi tiếp</p>
                          <p className="mt-1 font-bold text-[#17324d] dark:text-white">{followUpContext.subject}</p>
                          {followUpContext.question && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5a7b9c] dark:text-[#a9c1d6]">“{followUpContext.question}”</p>}
                        </div>
                        <button type="button" onClick={cancelFollowUp} className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[#5a7b9c] transition-colors hover:bg-white hover:text-[#0f2136] dark:hover:bg-white/10 dark:hover:text-white">Hủy</button>
                      </div>
                    </div>
                  )}

                  <Input label="Họ và tên" name="name" required maxLength={150} value={form.name} onChange={(event) => update("name", event.target.value)} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input label="Email" name="email" type="email" required maxLength={255} value={form.email} onChange={(event) => update("email", event.target.value)} />
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Nhập 10 chữ số"
                      value={form.phone}
                      error={phoneValidation.error}
                      onChange={(event) => handlePhoneChange(event.target.value)}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                    />
                  </div>
                  {followUpContext ? (
                    <Input label="Chủ đề gốc" name="subject" readOnly value={followUpContext.subject} />
                  ) : plans.length > 0 ? (
                    <Select label="Gói dịch vụ quan tâm" name="subject" required value={form.subject} onChange={(e) => update("subject", e.target.value)}>
                      {plans.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </Select>
                  ) : (
                    <Input label="Chủ đề" name="subject" required maxLength={250} value={form.subject} onChange={(event) => update("subject", event.target.value)} />
                  )}

                  <label className="grid gap-2 text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]">
                    Nội dung câu hỏi
                    <textarea
                      className="min-h-[140px] rounded-xl border border-[#ccdeeb] bg-[#f7fbfe] px-4 py-3 text-base font-medium text-[#07101f] shadow-[inset_0_1px_2px_rgba(7,64,103,.04)] outline-none transition-all duration-300 hover:border-[#a9cbe0] focus:border-[#0b8bd8] focus:bg-white focus:ring-4 focus:ring-[#0b8bd8]/15 dark:border-white/[0.1] dark:bg-[#071426]/78 dark:text-white dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.32)] dark:hover:border-white/20 dark:focus:border-[#67e8f9] dark:focus:bg-[#09192d] dark:focus:ring-[#22d3ee]/20 resize-y"
                      required
                      maxLength={3000}
                      value={form.message}
                      onChange={(event) => update("message", event.target.value)}
                      placeholder="Nhập chi tiết câu hỏi của bạn tại đây..."
                    />
                  </label>
                  <Button type="submit" isLoading={loading} className="w-full h-12 text-base rounded-xl font-bold bg-gradient-to-r from-[#0b8bd8] to-[#0873b8] hover:from-[#0a7bc0] hover:to-[#07629c] shadow-lg shadow-[#0b8bd8]/30">{followUpContext ? "Gửi câu hỏi tiếp theo" : "Gửi câu hỏi"}</Button>
                </form>
              )}
            </Card>

            {/* Lookup Card */}
            <Card className="shadow-xl shadow-[#a3c9e8]/20 dark:shadow-none border border-white/50 ring-1 ring-[#cce0ef] dark:ring-white/10 bg-white/70 dark:bg-[#071426]/70 backdrop-blur-3xl overflow-hidden rounded-3xl p-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-bold text-[#0f2136] dark:text-white flex items-center gap-2 tracking-tight">
                  <div className="p-1.5 bg-[#e6f4ff] dark:bg-[#0b8bd8]/20 rounded-lg text-[#0b8bd8] dark:text-[#38bdf8]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="11" cy="15" r="3"/><line x1="13.1" y1="17.1" x2="16" y2="20"/></svg>
                  </div>
                  Tra cứu yêu cầu riêng tư
                </h2>
                <p className="text-sm font-medium leading-relaxed text-[#5a7b9c] dark:text-[#8ba8c4]">Nhập mã REQ-... để theo dõi trạng thái yêu cầu bảo mật của bạn.</p>
              </div>
              <form className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={lookup}>
                <div className="min-w-0 flex-1">
                  <Input
                    label="Mã liên hệ"
                    name="trackingCode"
                    autoComplete="off"
                    placeholder="VD: REQ-260823-8BD524"
                    maxLength={50}
                    value={trackingCode}
                    onChange={(event) => setTrackingCode(event.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase())}
                  />
                </div>
                <Button type="submit" variant="secondary" isLoading={lookupLoading} className="h-11 rounded-xl px-6 font-bold">Kiểm tra</Button>
              </form>
              {lookupError && <div className="mt-4"><ErrorState description={lookupError} /></div>}

              {ticket && (
                <section className="mt-6 rounded-2xl border border-[#cce0ef] bg-[#f7fbfe] p-5 dark:border-white/5 dark:bg-white/[0.02]" aria-live="polite">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#5a7b9c] dark:text-[#8ba8c4]">Chủ đề</p>
                      <h3 className="mt-1 font-bold text-[#0f2136] dark:text-white text-lg">{ticket.subject}</h3>
                    </div>
                    <span className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${ticket.status === "Replied" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" : ticket.status === "Read" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20" : "bg-[#e6f4ff] text-[#0b8bd8] dark:bg-[#0b8bd8]/20 dark:text-[#38bdf8] border border-[#bce0f8] dark:border-[#0b8bd8]/30"}`}>
                      {statusLabel(ticket.status)}
                    </span>
                  </div>
                  {ticket.adminReply ? (
                    <div className="mt-5 border-t border-[#d6ebfa] dark:border-white/5 pt-5 relative">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#0b8bd8] to-[#0873b8] flex items-center justify-center text-white shadow-md">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <ResponderBadge role={ticket.repliedByRole} className="text-sm uppercase tracking-wider text-[#0873b8] dark:text-[#38bdf8]" />
                      </div>
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#1e3a5a] dark:text-slate-200 pl-9 font-medium">{ticket.adminReply}</p>
                      {ticket.repliedAt && <p className="mt-3 text-xs font-semibold text-[#8ba8c4] pl-9 uppercase tracking-wider">Vào lúc {displayDate(ticket.repliedAt)}</p>}
                    </div>
                  ) : (
                    <div className="mt-5 border-t border-[#d6ebfa] dark:border-white/5 pt-5 flex items-center gap-3">
                      <div className="animate-pulse flex space-x-1">
                        <div className="h-2 w-2 bg-[#5a7b9c] dark:bg-[#8ba8c4] rounded-full"></div>
                        <div className="h-2 w-2 bg-[#5a7b9c] dark:bg-[#8ba8c4] rounded-full animation-delay-200"></div>
                        <div className="h-2 w-2 bg-[#5a7b9c] dark:bg-[#8ba8c4] rounded-full animation-delay-400"></div>
                      </div>
                      <p className="text-sm font-medium text-[#5a7b9c] dark:text-[#8ba8c4]">Đội ngũ đang xem yêu cầu. Bạn không cần gửi lại biểu mẫu.</p>
                    </div>
                  )}
                </section>
              )}
            </Card>
          </div>

          {/* The default tab proves fulfilled-order feedback while preserving the contextual Q&A follow-up flow. */}
          <div className="lg:col-span-7">
            <CommunityEngagementPanel onFollowUp={startFollowUp} />
          </div>
        </div>
      </Container>
    </main>
  );
}
