"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, CheckCircle2, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword } from "@/features/auth/session-client";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  const checks = useMemo(() => [
    { label: "Ít nhất 12 ký tự", passed: newPassword.length >= 12 },
    { label: "Chứa chữ hoa & thường", passed: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) },
    { label: "Ký tự đặc biệt hoặc số", passed: /[0-9\W]/.test(newPassword) },
  ], [newPassword]);
  const passwordsMatch = !confirmation || newPassword === confirmation;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmation) { setError("Xác nhận mật khẩu mới chưa khớp."); return; }
    if (currentPassword === newPassword) { setError("Mật khẩu mới phải khác mật khẩu hiện tại."); return; }
    setLoading(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setCompleted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl animate-[sr-kf-fadeUp_0.6s_forwards]">
      <PageHeading title="Đổi mật khẩu" description="Cập nhật thông tin bảo mật để bảo vệ tài khoản quản trị của bạn." />
      
      {completed ? (
        <Card className="mx-auto max-w-2xl overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.04] via-white/70 to-emerald-500/[0.08] p-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:from-emerald-900/20 dark:via-ink-900/60 dark:to-emerald-900/20">
          <div className="p-10 text-center sm:p-12">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-500/10">
              <CheckCircle2 size={40} />
            </span>
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Mật khẩu đã cập nhật!</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 dark:text-white/60">
              Vì lý do bảo mật, mọi phiên đăng nhập trên các thiết bị khác đã được kết thúc. Vui lòng đăng nhập lại với mật khẩu mới.
            </p>
            <Link className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-8 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/20 dark:bg-white dark:text-slate-950 dark:shadow-white/5 dark:hover:shadow-white/10" href="/admin/login">
              Đăng nhập lại
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="relative flex flex-col overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 sm:p-10">
            {/* Premium background effects */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-[80px]" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-indigo-500/25 blur-[80px]" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            
            <div className="relative z-10 flex-1">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-cyan-400 ring-1 ring-white/15 backdrop-blur-md">
                <LockKeyhole size={26} strokeWidth={1.5} />
              </span>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                Bảo mật cấp cao
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight leading-tight">
                Tăng cường <br /> lớp bảo vệ.
              </h2>
              <p className="mt-4 text-sm leading-6 text-white/60">
                Tài khoản quản trị cần được bảo vệ tuyệt đối. Đổi mật khẩu sẽ lập tức thu hồi các phiên truy cập (refresh token) cũ.
              </p>
              
              <div className="mt-10 grid gap-3">
                {checks.map((check) => (
                  <div key={check.label} className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08]">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${check.passed ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-white/40"}`}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className={`text-sm font-semibold transition-colors ${check.passed ? "text-white" : "text-white/60 group-hover:text-white/80"}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative z-10 mt-10 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-4 border border-white/5">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-cyan-400" />
              <p className="text-xs leading-5 text-cyan-50/80">
                Mẹo: Hãy sử dụng một cụm từ dài (passphrase) thay vì một từ ngắn. Nó dễ nhớ với bạn nhưng rất khó bị bẻ khóa.
              </p>
            </div>
          </aside>

          <Card className="relative overflow-hidden rounded-[2rem] border-slate-200/60 bg-white/70 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/40 sm:p-10">
            <div className="flex items-start gap-5 border-b border-slate-200/60 pb-6 dark:border-white/10">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-river-600/10 text-river-700 dark:bg-cyan-400/10 dark:text-cyan-400">
                <KeyRound size={24} strokeWidth={1.5} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Thiết lập mật khẩu mới</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/55">Hoàn thành biểu mẫu dưới đây để xác nhận thay đổi.</p>
              </div>
            </div>
            
            {error && <div className="mt-6"><ErrorState title="Không thể đổi mật khẩu" description={error} /></div>}
            
            <form className="mt-8 grid gap-6" onSubmit={submit}>
              <PasswordInput label="Mật khẩu hiện tại" name="currentPassword" autoComplete="current-password" required minLength={5} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              
              <div className="mt-2 space-y-6 rounded-2xl bg-slate-50/50 p-6 border border-slate-100 dark:border-white/5 dark:bg-white/[0.02]">
                <PasswordInput label="Mật khẩu mới" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} hint="Nhập ít nhất 12 ký tự." />
                <PasswordInput label="Xác nhận mật khẩu mới" name="confirmation" autoComplete="new-password" required minLength={12} value={confirmation} error={!passwordsMatch ? "Mật khẩu xác nhận chưa khớp." : undefined} onChange={(event) => setConfirmation(event.target.value)} />
              </div>

              <div className="mt-4 flex flex-col-reverse gap-4 border-t border-slate-200/60 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                <p className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-white/60">
                  <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Bạn sẽ cần đăng nhập lại.
                </p>
                <Button type="submit" isLoading={loading} className="h-12 rounded-xl sm:min-w-[12rem]">
                  Cập nhật mật khẩu
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}