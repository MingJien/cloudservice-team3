"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { login } from "@/features/auth/session-client";
import Link from "next/link";
import { Activity, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(identifier.trim(), password);
      const candidate = new URLSearchParams(window.location.search).get("returnUrl") ?? "/admin";
      const returnUrl = candidate.startsWith("/admin") && !candidate.startsWith("//") ? candidate : "/admin";
      router.replace(returnUrl);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 font-sans bg-ink-950 text-white selection:bg-river-500/30">
      {/* Left Section - Graphic / Branding */}
      <section className="dark relative hidden lg:flex flex-col p-12 overflow-hidden border-r border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0" 
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-ink-950/70 z-10 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 to-transparent z-10" />

        <div className="relative z-20 flex items-center gap-2">
          <Activity className="text-river-400" size={28} />
          <p className="text-2xl font-black tracking-tighter text-white">
            Mekong<span className="text-river-400">Node</span>
          </p>
        </div>

        <div className="relative z-20 flex-1 flex flex-col justify-center mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-river-500/10 border border-river-500/20 text-river-400 text-xs font-bold uppercase tracking-widest mb-6">
              <ShieldCheck size={14} /> Control Plane
            </div>
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight mb-6 text-white drop-shadow-lg">
              Quản trị hạ tầng<br/>bằng những thao tác<br/>
              <span className="text-river-400">
                có thể truy vết.
              </span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80">
              Phiên đăng nhập sử dụng công nghệ JWT ngắn hạn, refresh token xoay vòng và nhật ký bảo mật chuẩn doanh nghiệp, tuyệt đối không lưu trữ credential ở client.
            </p>
          </div>
        </div>
        
        <p className="relative z-20 text-xs font-medium text-white/40 tracking-wide uppercase mt-auto">
          MekongNode &copy; {new Date().getFullYear()} Cloud Service Administration
        </p>
      </section>

      {/* Right Section - Login Form */}
      <section className="relative grid place-items-center p-6 sm:p-12 bg-[#f8fafc] text-[#0f172a] z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
        {/* Nút quay về trang chủ */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-30">
          <Link 
            href="/" 
            className="group flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-river-600 transition-colors bg-white/60 hover:bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
          >
            <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Về trang chủ
          </Link>
        </div>

        <div className="w-full max-w-[420px] relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
            <Activity className="text-river-600" size={32} />
            <p className="text-3xl font-black tracking-tighter text-[#0f172a]">
              Mekong<span className="text-river-600">Node</span>
            </p>
          </div>

          <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-[#0f172a] mb-2">Đăng nhập quản trị</h2>
              <p className="text-sm text-[#64748b]">Chào mừng trở lại! Vui lòng nhập thông tin xác thực để truy cập hệ thống.</p>
            </div>

            {error && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <ErrorState title="Xác thực thất bại" description={error} />
              </div>
            )}

            <form className="grid gap-5" onSubmit={submit}>
              <div className="grid gap-1.5">
                <Input 
                  label="Tên đăng nhập hoặc email" 
                  name="identifier" 
                  autoComplete="username" 
                  required 
                  minLength={3} 
                  value={identifier} 
                  onChange={(event) => setIdentifier(event.target.value)} 
                  containerClassName="text-[#0f172a] dark:text-[#0f172a]"
                  className="bg-[#ffffff] border-[#e2e8f0] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-river-600 focus:ring-1 focus:ring-river-600/50 dark:bg-[#ffffff] dark:border-[#e2e8f0] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                />
              </div>
              <div className="grid gap-1.5">
                <PasswordInput 
                  label="Mật khẩu" 
                  name="password" 
                  autoComplete="current-password" 
                  required 
                  minLength={5} 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  containerClassName="text-[#0f172a] dark:text-[#0f172a]"
                  className="bg-[#ffffff] border-[#e2e8f0] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-river-600 focus:ring-1 focus:ring-river-600/50 dark:bg-[#ffffff] dark:border-[#e2e8f0] dark:text-[#0f172a] dark:placeholder:text-[#94a3b8]"
                />
              </div>
              
              <Button 
                type="submit" 
                isLoading={loading} 
                className="mt-4 w-full h-12 bg-river-600 hover:bg-river-700 text-white rounded-xl font-bold text-base shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2 group border-0"
              >
                {!loading && (
                  <>
                    Xác nhận truy cập
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-[11px] font-medium leading-5 text-[#94a3b8] px-4">
            Mật khẩu được băm PBKDF2; phiên quản trị dùng JWT ngắn hạn và refresh token xoay vòng.<br />Các sự kiện xác thực quan trọng được ghi vào Audit Log.
          </p>
        </div>
      </section>
    </main>
  );
}
