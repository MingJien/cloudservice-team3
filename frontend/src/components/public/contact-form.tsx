"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createContact, getContactStatus } from "@/features/content/api";
import type { Contact, PublicContactStatus } from "@/features/content/api";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

const CONTACT_TICKET_KEY = "mekongnode.contact-ticket";

function publicStatus(contact: Contact): PublicContactStatus {
  return {
    trackingCode: contact.trackingCode,
    subject: contact.subject,
    status: contact.status,
    adminReply: contact.adminReply,
    createdAt: contact.createdAt,
    repliedAt: contact.repliedAt,
  };
}

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
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [ticket, setTicket] = useState<PublicContactStatus | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    const queryCode = new URLSearchParams(window.location.search).get("ticket");
    const savedCode = window.localStorage.getItem(CONTACT_TICKET_KEY);
    const code = (queryCode || savedCode || "").trim().toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(code)) return;

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
      const created = await createContact({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      rememberTicket(publicStatus(created));
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi liên hệ.");
    } finally {
      setLoading(false);
    }
  }

  async function lookup(event?: FormEvent) {
    event?.preventDefault();
    const code = trackingCode.trim().toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(code)) {
      setLookupError("Mã liên hệ gồm đúng 32 ký tự a-f và 0-9.");
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

  async function copyTrackingCode() {
    if (!ticket) return;
    await navigator.clipboard.writeText(ticket.trackingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="py-12 md:py-16">
      <Container>
        <PageHeading
          title="Liên hệ đội tư vấn"
          description="Gửi nhu cầu triển khai hoặc câu hỏi kỹ thuật. Bạn sẽ nhận một mã riêng để theo dõi câu trả lời ngay trên trang này."
        />

        <Card className="mx-auto max-w-3xl">
          {sent ? (
            <div className="py-5 text-center">
              <p className="text-lg font-bold text-success-600">Đã tiếp nhận yêu cầu của bạn.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Mã đã được lưu trên thiết bị này. Hãy giữ lại mã để tra cứu trên thiết bị khác.
              </p>
              <div className="mx-auto mt-5 flex max-w-lg flex-col items-stretch gap-2 rounded-xl border border-line-200 bg-ice-100/60 p-3 sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5">
                <code className="min-w-0 flex-1 break-all text-sm font-bold text-river-700 dark:text-cyan-300">{ticket?.trackingCode}</code>
                <Button type="button" variant="secondary" onClick={() => void copyTrackingCode()}>{copied ? "Đã sao chép" : "Sao chép mã"}</Button>
              </div>
              <Button type="button" variant="ghost" className="mt-4" onClick={() => setSent(false)}>Gửi yêu cầu khác</Button>
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={submit}>
              {error && <ErrorState description={error} />}
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Họ và tên" name="name" required maxLength={150} value={form.name} onChange={(event) => update("name", event.target.value)} />
                <Input label="Email" name="email" type="email" required maxLength={255} value={form.email} onChange={(event) => update("email", event.target.value)} />
                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Nhập đúng 10 chữ số"
                  value={form.phone}
                  error={phoneValidation.error}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
                />
                <Input label="Chủ đề" name="subject" required maxLength={250} value={form.subject} onChange={(event) => update("subject", event.target.value)} />
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Nội dung
                <textarea
                  className="min-h-36 rounded-xl border border-line-200 bg-white px-3 py-2 outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15 dark:border-white/10 dark:bg-white/5"
                  required
                  maxLength={3000}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                />
              </label>
              <Button type="submit" isLoading={loading}>Gửi liên hệ</Button>
            </form>
          )}
        </Card>

        <Card className="mx-auto mt-6 max-w-3xl">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-ink-950 dark:text-white">Tra cứu phản hồi</h2>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Nhập mã được cấp sau khi gửi. Trang tự kiểm tra cập nhật mỗi 30 giây khi yêu cầu đang xử lý.</p>
          </div>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={lookup}>
            <div className="min-w-0 flex-1">
              <Input
                label="Mã liên hệ"
                name="trackingCode"
                autoComplete="off"
                maxLength={32}
                value={trackingCode}
                onChange={(event) => setTrackingCode(event.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 32))}
              />
            </div>
            <Button type="submit" variant="secondary" isLoading={lookupLoading}>Kiểm tra</Button>
          </form>
          {lookupError && <div className="mt-4"><ErrorState description={lookupError} /></div>}

          {ticket && (
            <section className="mt-5 rounded-2xl border border-[#cfe2ee] bg-[#f7fbfe] p-5 dark:border-white/10 dark:bg-white/[0.04]" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Chủ đề</p>
                  <h3 className="mt-1 font-bold text-ink-950 dark:text-white">{ticket.subject}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${ticket.status === "Replied" ? "bg-success-600/10 text-success-600" : ticket.status === "Read" ? "bg-warning-600/10 text-warning-600" : "bg-river-600/10 text-river-700 dark:text-cyan-300"}`}>
                  {statusLabel(ticket.status)}
                </span>
              </div>
              {ticket.adminReply ? (
                <div className="mt-5 border-t border-[#dce9f1] pt-5 dark:border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-river-700 dark:text-cyan-300">Phản hồi từ MekongNode</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">{ticket.adminReply}</p>
                  {ticket.repliedAt && <p className="mt-3 text-xs text-slate-500">Phản hồi lúc {displayDate(ticket.repliedAt)}</p>}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Đội ngũ đang xem yêu cầu. Câu trả lời sẽ xuất hiện tại đây, bạn không cần gửi lại biểu mẫu.</p>
              )}
            </section>
          )}
        </Card>
      </Container>
    </main>
  );
}
