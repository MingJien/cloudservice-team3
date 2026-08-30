"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, CircleDollarSign, Network } from "lucide-react";
import { BrandLockup } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { login } from "@/features/auth/session-client";

export default function AffiliateLoginPage() {
  const showDemoCredentials = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const session = await login(identifier.trim(), password);
      if (session.user.role !== "Affiliate") throw new Error("Tài khoản này không thuộc chương trình đối tác.");
      router.replace("/affiliate-portal"); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Không thể đăng nhập."); }
    finally { setBusy(false); }
  }

  return <main className="relative min-h-screen overflow-hidden bg-[#f4faff] px-5 py-8 font-sans text-[#07101f] dark:bg-[#07101f] dark:text-white sm:px-8">
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(7,95,157,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(7,95,157,.055)_1px,transparent_1px)] bg-[size:44px_44px] dark:bg-[linear-gradient(rgba(103,232,249,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.035)_1px,transparent_1px)] dark:bg-[size:44px_44px]" />
    <div className="pointer-events-none absolute -left-48 top-20 size-[34rem] rounded-full bg-[#38bdf8]/15 blur-[110px]" /><div className="pointer-events-none absolute -right-56 bottom-0 size-[38rem] rounded-full bg-[#6366f1]/12 blur-[130px]" />
    <div className="relative mx-auto flex max-w-6xl items-center justify-between"><Link href="/"><BrandLockup tone="adaptive" /></Link><Link href="/affiliate" className="text-sm font-bold text-[#075f9d] dark:text-cyan-300">Chính sách đối tác</Link></div>
    <div className="relative mx-auto mt-12 grid max-w-6xl overflow-hidden rounded-[2rem] border border-[#c9dfec] bg-white/80 shadow-[0_40px_100px_-48px_rgba(7,64,103,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0a182b]/85 dark:shadow-[0_45px_120px_-55px_rgba(0,0,0,.95)] lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#064a78_0%,#075f9d_50%,#0b7ebf_100%)] p-8 text-white sm:p-12">
        <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/15" /><div className="absolute -right-10 -top-10 size-52 rounded-full border border-white/10" />
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">MekongNode Partner Network</p>
        <h1 className="mt-5 max-w-lg text-4xl font-black leading-[1.08] tracking-[-.035em] sm:text-5xl">Một đường link.<br />Một sổ cái rõ ràng.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-blue-50/85">Theo dõi click 60 ngày, đơn đã chốt và từng khoản hoa hồng đang giữ. Không dùng bộ đếm ảo; mỗi số tiền đều quay về được đơn nguồn.</p>
        <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[{ icon: Network, value: "60 ngày", label: "Last-click" }, { icon: BadgeCheck, value: "30 ngày", label: "Đối soát" }, { icon: CircleDollarSign, value: "500K", label: "Ngưỡng rút" }].map(({ icon: Icon, value, label }) => <div key={label} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl"><Icon size={18} className="text-cyan-200" /><strong className="mt-4 block text-xl tabular-nums">{value}</strong><span className="text-xs text-blue-100/75">{label}</span></div>)}
        </div>
      </section>
      <section className="p-8 sm:p-12 lg:p-14">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0873b8] dark:text-cyan-300">Partner Control Room</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">Đăng nhập đối tác</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Thông tin đăng nhập được cấp sau khi hồ sơ được duyệt.</p>
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p>}
        <form className="mt-7 grid gap-5" onSubmit={submit}>
          <Input label="Tên đăng nhập hoặc email" name="affiliate-identifier" autoComplete="username" required minLength={3} value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          <PasswordInput label="Mật khẩu" name="affiliate-password" autoComplete="current-password" required minLength={5} value={password} onChange={(event) => setPassword(event.target.value)} />
          <Button type="submit" isLoading={busy} className="mt-2 w-full">Vào Partner Portal <ArrowRight size={17} /></Button>
        </form>
        {showDemoCredentials && <p className="mt-7 text-xs leading-5 text-slate-500">Tài khoản demo hạng Bạc: <code className="font-bold">affb</code> / <code className="font-bold">affb123</code>. Dữ liệu được đánh dấu demo và không đại diện giao dịch thật.</p>}
      </section>
    </div>
  </main>;
}
