"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, BadgeCheck, Check, ClipboardCheck, Clock3, Copy, Fingerprint, Link2, MousePointerClick, Search, ShieldCheck, UserRoundCheck, WalletCards } from "lucide-react";
import { createAffiliate, getAffiliateApplicationStatus } from "@/features/affiliates/api";
import type { AffiliateApplicationStatus, AffiliateApplicationSubmission, AffiliateApplicationTracking } from "@/features/affiliates/api";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

const workflow = [
  { icon: UserRoundCheck, step: "01", title: "Duyệt hồ sơ", detail: "Admin hoặc Editor kiểm tra kênh, tệp người xem; tỷ lệ được chốt và lưu trong hồ sơ đối tác." },
  { icon: Link2, step: "02", title: "Cấp mã giới thiệu", detail: "Mã đối tác chỉ sinh sau khi hồ sơ được duyệt, không phát hành tự động cho dữ liệu rác." },
  { icon: WalletCards, step: "03", title: "Ghi nhận chuyển đổi", detail: "Đơn hoàn tất giữ snapshot tỷ lệ hoa hồng tại thời điểm chuyển đổi để đối soát." },
] as const;

const AFFILIATE_TRACKING_CODE_KEY = "mekongnode.affiliate-application-code";

const statusCopy: Record<AffiliateApplicationStatus, { label: string; detail: string; tone: string }> = {
  New: { label: "Đã tiếp nhận", detail: "Hồ sơ đã vào hàng chờ để đội vận hành phân loại.", tone: "border-sky-200 bg-sky-50 text-sky-800 dark:border-cyan-300/20 dark:bg-cyan-300/[0.08] dark:text-cyan-100" },
  Processing: { label: "Đang thẩm định", detail: "Nhóm đang kiểm tra kênh giới thiệu và mức độ phù hợp.", tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/[0.08] dark:text-amber-100" },
  Done: { label: "Đã duyệt", detail: "Hồ sơ đã được kích hoạt. Mã giới thiệu bên dưới có thể dùng cho liên kết đối tác.", tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/[0.08] dark:text-emerald-100" },
  Rejected: { label: "Chưa được duyệt", detail: "Hồ sơ hiện chưa đáp ứng tiêu chí tiếp nhận. Không cần gửi hồ sơ trùng; đội vận hành có thể mở lại hồ sơ khi phù hợp.", tone: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-300/20 dark:bg-rose-300/[0.08] dark:text-rose-100" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

export function AffiliateForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", channel: "", note: "" });
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sent, setSent] = useState(false);
  const [submission, setSubmission] = useState<AffiliateApplicationSubmission | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingResult, setTrackingResult] = useState<AffiliateApplicationTracking | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, phone: digits }));
  }

  const phoneValidation = useMemo(() => {
    if (!form.phone && !phoneFocused) return { hint: "Nhập đủ 10 chữ số, bắt đầu bằng số 0", error: undefined };
    if (!form.phone && phoneFocused) return { hint: undefined, error: undefined };
    if (!form.phone.startsWith("0")) return { error: "Số điện thoại phải bắt đầu bằng số 0 (ví dụ: 0912345678).", hint: undefined };
    if (form.phone.length < 10) return { hint: `Đang nhập ${form.phone.length}/10 số`, error: undefined };
    return { hint: "✓ Số điện thoại hợp lệ", error: undefined };
  }, [form.phone, phoneFocused]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const receipt = await createAffiliate({ fullName: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), websiteOrChannel: form.channel.trim() || undefined, note: form.note.trim() || undefined });
      window.localStorage.setItem(AFFILIATE_TRACKING_CODE_KEY, receipt.trackingCode);
      setSubmission(receipt);
      setTrackingInput(receipt.trackingCode);
      setTrackingResult({ ...receipt, updatedAt: null, affiliateCode: null });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi đăng ký.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trackingCode = trackingInput.trim().toUpperCase();
    if (!trackingCode) {
      setTrackingError("Nhập mã hồ sơ Affiliate để tra cứu.");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    try {
      const result = await getAffiliateApplicationStatus(trackingCode);
      window.localStorage.setItem(AFFILIATE_TRACKING_CODE_KEY, result.trackingCode);
      setTrackingInput(result.trackingCode);
      setTrackingResult(result);
    } catch (caught) {
      setTrackingResult(null);
      setTrackingError(caught instanceof Error ? caught.message : "Không thể tra cứu hồ sơ lúc này.");
    } finally {
      setTrackingLoading(false);
    }
  }

  async function copyTrackingCode() {
    const trackingCode = submission?.trackingCode ?? trackingResult?.trackingCode;
    if (!trackingCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function loadSavedTrackingCode() {
    const savedCode = window.localStorage.getItem(AFFILIATE_TRACKING_CODE_KEY);
    if (!savedCode) {
      setTrackingError("Chưa có mã hồ sơ nào được lưu trên trình duyệt này.");
      return;
    }

    setTrackingInput(savedCode);
    setTrackingError("");
  }

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_46%,#f6fbfe_100%)] text-[#07101f] dark:bg-[linear-gradient(180deg,#07101f_0%,#091528_44%,#07101f_100%)] dark:text-white">
      <section className="relative border-b border-[#dbeaf3] py-14 dark:border-white/[0.06] md:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgba(34,211,238,.18),transparent_28%),linear-gradient(rgba(8,115,184,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(8,115,184,.045)_1px,transparent_1px)] bg-[size:auto,44px_44px,44px_44px] dark:opacity-60" />
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c7e3f3] bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] dark:border-cyan-300/15 dark:bg-white/[0.05] dark:text-cyan-300"><MousePointerClick size={14} /> MekongNode Partner Program</span>
               <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.05em] sm:text-5xl lg:text-[3.65rem]">Giới thiệu đúng nhu cầu. <span className="bg-[linear-gradient(100deg,#066aa9,#00a9cc)] bg-clip-text text-transparent dark:bg-[linear-gradient(100deg,#67e8f9,#93c5fd)] dark:bg-clip-text">Theo dõi bằng dữ liệu.</span></h1>
               <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">Chương trình dành cho cộng đồng công nghệ, freelancer và đội triển khai có tệp khách hàng phù hợp với Cloud/VPS. Tỷ lệ không quảng cáo cứng: quản trị viên duyệt theo chất lượng kênh và lưu trực tiếp trong hồ sơ đối tác.</p>
               <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#17334d] dark:text-slate-200">{["Không thu phí đăng ký", "Cửa sổ ghi nhận 30 ngày", "Tỷ lệ có snapshot theo đơn"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-500" />{item}</span>)}</div>
               <div className="mt-8 flex flex-wrap items-center gap-4">
                 <Link href="/affiliate/login" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0873b8] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_-16px_rgba(8,115,184,.9)] transition hover:-translate-y-0.5 hover:bg-[#066aa9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0873b8] focus-visible:ring-offset-2 dark:bg-cyan-400 dark:text-[#06223a] dark:hover:bg-cyan-300 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-[#07101f]">
                   Đăng nhập đối tác <ArrowRight size={16} aria-hidden="true" />
                 </Link>
                 <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Đã được duyệt và nhận thông tin đăng nhập? Vào Partner Portal để theo dõi hoa hồng.</p>
               </div>
             </div>

            <aside className="relative overflow-hidden rounded-[1.7rem] border border-[#c7dfec] bg-white/90 p-7 shadow-[0_30px_75px_-48px_rgba(7,64,103,.72)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1b32]/92 sm:p-8">
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-300/18 blur-[70px]" />
              <div className="relative flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0873b8] dark:text-cyan-300">Attribution controls</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Hoa hồng có thể giải trình</h2></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#cfe4f1] bg-[#eef9fe] text-[#0873b8] dark:border-cyan-300/15 dark:bg-cyan-300/[0.07] dark:text-cyan-300"><Fingerprint size={22} /></span></div>
              <div className="relative mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[{ value: "30 ngày", label: "Cookie giới thiệu" }, { value: "Snapshot", label: "Tỷ lệ theo đơn" }, { value: "Outbox", label: "Xử lý tin cậy" }].map((item) => <div key={item.label} className="rounded-2xl border border-[#dceaf2] bg-[#f8fcff] p-4 dark:border-white/[0.08] dark:bg-white/[0.035]"><strong className="text-lg tracking-tight text-[#0873b8] dark:text-cyan-300">{item.value}</strong><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.label}</span></div>)}
              </div>
              <p className="relative mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-500" /> Tỷ lệ và hoa hồng hiển thị trong quản trị lấy từ API; giao diện công khai không tự dựng con số quảng cáo.</p>
            </aside>
          </div>
        </Container>
      </section>

      <section className="relative z-10 -mt-5 pb-2 sm:-mt-8 md:pb-4">
        <Container>
          <div className="mx-auto grid max-w-6xl gap-6 rounded-[1.55rem] border border-[#c8e2ef] bg-white/92 p-5 shadow-[0_24px_58px_-42px_rgba(7,64,103,.78)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1a30]/92 sm:p-7 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#0873b8] dark:text-cyan-300"><ClipboardCheck size={15} /> Theo dõi hồ sơ</span>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">Đã gửi đăng ký Affiliate?</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Nhập mã hồ sơ để xem tiến độ duyệt. Mã này chỉ trả về trạng thái và mã đối tác sau khi được duyệt, không hiển thị dữ liệu liên hệ.</p>
            </div>
            <div>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={lookupStatus}>
                <div className="min-w-0 flex-1"><Input label="Mã hồ sơ Affiliate" name="affiliateTrackingCode" autoComplete="off" maxLength={40} placeholder="AFF-XXXXXXXXXXXX" value={trackingInput} onChange={(event) => setTrackingInput(event.target.value.toUpperCase())} /></div>
                <Button type="submit" isLoading={trackingLoading} className="min-h-11 shrink-0 sm:mb-[1px]"><Search size={16} className="mr-2" />Tra cứu</Button>
              </form>
              <button type="button" onClick={loadSavedTrackingCode} className="mt-2 text-xs font-semibold text-[#0873b8] underline-offset-4 transition hover:underline dark:text-cyan-300">Dùng mã đã lưu trên trình duyệt này</button>
              {trackingError && <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-300" role="alert">{trackingError}</p>}
              {trackingResult && (() => {
                const status = statusCopy[trackingResult.status];
                return <div className={`mt-4 rounded-2xl border p-4 ${status.tone}`} aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">Trạng thái hồ sơ</p><strong className="mt-1 block text-lg">{status.label}</strong></div><code className="rounded-lg border border-current/15 bg-white/45 px-2.5 py-1.5 font-mono text-xs font-bold dark:bg-black/10">{trackingResult.trackingCode}</code></div><p className="mt-2 text-sm leading-6 opacity-90">{status.detail}</p><p className="mt-3 text-xs opacity-75">Gửi lúc {dateTimeFormatter.format(new Date(trackingResult.createdAt))}{trackingResult.updatedAt ? ` · Cập nhật ${dateTimeFormatter.format(new Date(trackingResult.updatedAt))}` : ""}</p>{trackingResult.affiliateCode && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-current/15 bg-white/45 p-3 dark:bg-black/10"><span className="text-xs font-semibold uppercase tracking-wide">Mã đối tác</span><code className="font-mono font-bold">{trackingResult.affiliateCode}</code></div>}</div>;
              })()}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20">
        <Container>
          <div className="mx-auto max-w-5xl text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0873b8] dark:text-cyan-300">Quy trình 3 bước</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Từ hồ sơ đến chuyển đổi, không có bước mơ hồ</h2></div>
          <div className="mx-auto mt-9 grid max-w-6xl gap-4 md:grid-cols-3">{workflow.map(({ icon: Icon, step, title, detail }) => <article key={step} className="group rounded-[1.45rem] border border-[#d2e4ee] bg-white p-6 shadow-[0_20px_50px_-42px_rgba(7,64,103,.7)] transition-all duration-300 hover:-translate-y-1 hover:border-[#91c8e2] dark:border-white/[0.09] dark:bg-[#0d1b32] dark:hover:border-cyan-300/25"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf7fd] text-[#0873b8] dark:bg-cyan-300/10 dark:text-cyan-300"><Icon size={20} /></span><span className="font-mono text-sm font-bold text-slate-300 dark:text-white/20">{step}</span></div><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p></article>)}</div>
        </Container>
      </section>

      <section className="border-t border-[#dcebf4] bg-white/70 py-14 dark:border-white/[0.06] dark:bg-white/[0.025] md:py-20">
        <Container>
          <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[1.8rem] border border-[#cbe0ec] bg-white shadow-[0_35px_85px_-55px_rgba(7,64,103,.8)] dark:border-white/10 dark:bg-[#0b182b] lg:grid-cols-[.82fr_1.18fr]">
            <div className="relative overflow-hidden bg-[linear-gradient(145deg,#06162a,#083b5b_58%,#087ca4)] p-8 text-white sm:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="relative"><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300"><BadgeCheck size={15} /> Tiêu chí tiếp nhận</span><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">Hồ sơ càng rõ, duyệt càng nhanh</h2><p className="mt-4 text-sm leading-7 text-slate-300">Cho nhóm biết bạn đang xây nội dung gì, tệp khách hàng quan tâm điều gì và cách bạn dự định giới thiệu dịch vụ.</p><ul className="mt-7 grid gap-3 text-sm text-slate-200">{["Thông tin liên hệ có thể xác minh", "Kênh công khai hoặc mô tả tệp khách hàng", "Không dùng spam, quảng cáo sai SLA hoặc chứng chỉ"].map((item) => <li key={item} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />{item}</li>)}</ul><p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-300"><Clock3 size={14} /> Trạng thái hồ sơ được quản trị theo New → Processing → Done/Rejected</p></div>
            </div>

            <div className="p-7 sm:p-10">
              {sent ? (
                <div className="flex min-h-[28rem] flex-col items-center justify-center text-center" aria-live="polite"><span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-[0_18px_35px_-24px_rgba(5,150,105,.8)] dark:bg-emerald-300/10 dark:text-emerald-300"><BadgeCheck size={30} /></span><h2 className="mt-6 text-2xl font-bold">Hồ sơ đã vào hàng chờ duyệt</h2><p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">Đội vận hành sẽ kiểm tra kênh và liên hệ trước khi cấp mã. Việc gửi hồ sơ chưa đồng nghĩa với đối tác đã được kích hoạt.</p>{submission && <div className="mt-6 w-full max-w-md rounded-2xl border border-[#b8dcec] bg-[#f3fbff] p-4 text-left dark:border-cyan-300/15 dark:bg-cyan-300/[0.06]"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0873b8] dark:text-cyan-300">Lưu mã hồ sơ để tra cứu</p><div className="mt-2 flex items-center justify-between gap-3"><code className="min-w-0 truncate font-mono text-base font-bold text-[#073b5d] dark:text-cyan-100">{submission.trackingCode}</code><button type="button" onClick={() => void copyTrackingCode()} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#b8dcec] bg-white px-2.5 py-1.5 text-xs font-bold text-[#075f9d] transition hover:border-[#0b8bd8] hover:bg-[#edf9ff] dark:border-cyan-300/20 dark:bg-white/[0.06] dark:text-cyan-200">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Đã chép" : "Sao chép"}</button></div></div>}</div>
              ) : (
                <form className="grid gap-5" onSubmit={submit}>
                  <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0873b8] dark:text-cyan-300">Đăng ký đối tác</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Thông tin để nhóm thẩm định</h2></div>
                  {error && <ErrorState title="Không thể gửi hồ sơ" description={error} />}
                  <div className="grid gap-4 sm:grid-cols-2"><Input label="Họ và tên" name="name" required maxLength={150} value={form.name} onChange={(event) => update("name", event.target.value)} /><Input label="Email" name="email" type="email" required maxLength={255} hint="Mỗi email chỉ được tạo một hồ sơ" value={form.email} onChange={(event) => update("email", event.target.value)} /></div>
                  <Input label="Số điện thoại" name="phone" type="tel" inputMode="numeric" required maxLength={10} placeholder="0912345678" value={form.phone} error={phoneValidation.error} hint={phoneValidation.hint} onChange={(event) => handlePhoneChange(event.target.value)} onFocus={() => setPhoneFocused(true)} onBlur={() => setPhoneFocused(false)} />
                  <Input label="Website / kênh giới thiệu (nếu có)" name="channel" type="url" maxLength={500} pattern="https://.*" hint="Bắt buộc HTTPS; một kênh chỉ thuộc một hồ sơ" placeholder="https://..." value={form.channel} onChange={(event) => update("channel", event.target.value)} />
                  <label className="grid gap-2 text-sm font-semibold text-[#132a42] dark:text-[#dbe8f5]">Mô tả kênh và tệp khách hàng<textarea maxLength={2000} className="min-h-32 rounded-xl border border-[#ccdeeb] bg-[#f7fbfe] px-3 py-3 text-base font-medium text-[#07101f] outline-none transition focus:border-[#0b8bd8] focus:bg-white focus:ring-4 focus:ring-[#0b8bd8]/15 dark:border-white/10 dark:bg-[#071426]/78 dark:text-white dark:focus:border-cyan-300 dark:focus:ring-cyan-300/15" value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="Ví dụ: blog kỹ thuật cho SME, cộng đồng sinh viên IT, dịch vụ triển khai website..." /><span className="text-xs font-normal text-slate-500 dark:text-slate-400">{form.note.length}/2000 ký tự</span></label>
                  <Button type="submit" isLoading={loading} className="mt-1 w-full">Gửi hồ sơ để duyệt <ArrowRight size={16} className="ml-2" /></Button>
                  <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">Backend kiểm tra trùng email, số điện thoại và kênh ngay khi gửi. Hồ sơ cũ bị từ chối sẽ do quản trị viên mở lại, không đăng ký bản sao.</p>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
