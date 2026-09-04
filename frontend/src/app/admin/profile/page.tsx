"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, CheckCircle2, KeyRound, LoaderCircle, Mail, ShieldCheck, UserRound, Edit2, Save, X } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { currentSession, updateProfile, type SessionUser } from "@/features/auth/session-client";
import { Input } from "@/components/ui/input";

function initials(user: SessionUser) {
  return (user.fullName || user.userName)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function avatarSource(value?: string) {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ?? "http://localhost:8080";
  return `${apiBase}${value.startsWith("/") ? value : `/${value}`}`;
}

function ProfileDetail({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 p-5 transition-all hover:border-river-500/30 hover:bg-white/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-white/5 dark:hover:border-cyan-400/30 dark:hover:bg-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-river-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-cyan-400/10" />
      <div className="relative flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-river-600/10 text-river-700 dark:bg-cyan-400/10 dark:text-cyan-300">
          <Icon size={22} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/45">
            {label}
          </p>
          <p className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    currentSession()
      .then((session) => { if (active) setUser(session.user); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không thể tải hồ sơ tài khoản."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Vui lòng chọn một tệp hình ảnh hợp lệ."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh đại diện phải có dung lượng tối đa 5MB."); return; }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/admin/profile/avatar", { method: "POST", body: formData });
      if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as { detail?: string; title?: string };
        throw new Error(problem.detail ?? problem.title ?? "Không thể tải ảnh đại diện lên.");
      }
      const result = await response.json() as { avatarUrl: string };
      setUser((current) => current ? { ...current, avatarUrl: result.avatarUrl } : current);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tải ảnh đại diện lên.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><p className="flex items-center gap-3 text-sm font-semibold text-slate-500 dark:text-white/60"><LoaderCircle className="animate-spin text-river-600 dark:text-cyan-400" size={24} /> Đang tải hồ sơ...</p></div>;
  if (!user) return <div className="mx-auto max-w-3xl"><PageHeading title="Hồ sơ tài khoản" description="Thông tin nhận diện và cài đặt bảo mật của tài khoản quản trị." /><Card><p className="text-sm font-medium text-danger-600">{error || "Không tìm thấy thông tin tài khoản."}</p></Card></div>;

  const avatar = avatarSource(user.avatarUrl);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading title="Hồ sơ tài khoản" description="Quản lý định danh và thông tin cá nhân của bạn trong hệ thống." />
      {error && <p className="mb-6 rounded-xl border border-danger-600/25 bg-danger-600/5 px-5 py-4 text-sm font-medium text-danger-600" role="alert">{error}</p>}
      
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/40 dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          {/* Header Cover Background */}
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-river-600/20 via-slate-100/50 to-transparent dark:from-cyan-400/20 dark:via-ink-950/50" />
          
          <div className="relative p-8 pt-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-6">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[1.5rem] border-4 border-white bg-slate-950 text-3xl font-bold text-white shadow-xl shadow-slate-900/10 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-river-600/30 dark:border-ink-900" aria-label="Thay đổi ảnh đại diện">
                  {avatar ? <Image src={avatar} alt="Ảnh đại diện" fill sizes="112px" className="object-cover" unoptimized /> : initials(user)}
                  <span className="absolute inset-0 grid place-items-center bg-slate-950/65 opacity-0 transition-opacity group-hover:opacity-100">{uploading ? <LoaderCircle className="animate-spin text-white" size={26} /> : <Camera className="text-white" size={26} />}</span>
                </button>
                <div className="min-w-0 pb-2">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">{user.fullName || user.userName}</h2>
                  <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-white/60">
                    @{user.userName}
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={12} strokeWidth={3} /> Đang hoạt động</span>
                  </p>
                </div>
              </div>
            </div>
            
            <input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadAvatar} />
            
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Thông tin cơ bản</h3>
                {!isEditing ? (
                  <button type="button" onClick={() => { setIsEditing(true); setEditFullName(user.fullName || ""); setEditEmail(user.email || ""); }} className="flex items-center gap-1.5 text-sm font-semibold text-river-600 hover:text-river-700 dark:text-cyan-400 dark:hover:text-cyan-300">
                    <Edit2 size={14} /> Chỉnh sửa
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white">
                      <X size={14} /> Hủy
                    </button>
                    <button type="button" onClick={async () => {
                      setSaving(true);
                      setError("");
                      try {
                        const res = await updateProfile(editFullName, editEmail);
                        setUser(res.user);
                        setIsEditing(false);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Cập nhật thất bại.");
                      } finally {
                        setSaving(false);
                      }
                    }} disabled={saving} className="flex items-center gap-1.5 rounded-md bg-river-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-river-700 disabled:opacity-50">
                      {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />} Lưu
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileDetail icon={Mail} label="Email đăng nhập" value={user.email || "Chưa cập nhật"} />
                  <ProfileDetail icon={UserRound} label="Tên định danh" value={user.fullName || user.userName} />
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Tên hiển thị</label>
                    <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} disabled={saving} className="bg-white/50 dark:bg-black/20" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60">Email đăng nhập</label>
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={saving} className="bg-white/50 dark:bg-black/20" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-white/10">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 sm:w-auto sm:px-8">
                <Camera size={18} className="text-slate-400 transition-colors group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white/70" />
                {uploading ? "Đang xử lý..." : "Cập nhật ảnh đại diện mới"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Role Card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-river-500/15 bg-gradient-to-br from-river-600/[0.04] via-white/80 to-cyan-500/[0.04] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] backdrop-blur-xl dark:from-cyan-400/[0.06] dark:via-ink-900/60 dark:to-indigo-500/[0.06] dark:border-white/10">
            <div className="flex flex-col items-start gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-river-600 text-white shadow-xl shadow-river-600/20 dark:bg-cyan-400 dark:text-slate-950 dark:shadow-cyan-400/20">
                <ShieldCheck size={26} strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Quyền hạn hệ thống</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/70">
                  Tài khoản của bạn được gán vai trò <strong className="font-bold text-river-700 dark:text-cyan-300">{user.role}</strong>. Bạn có quyền truy cập vào các module tương ứng.
                </p>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/70 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Bảo mật tài khoản</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/70">Thay đổi mật khẩu định kỳ để đảm bảo an toàn.</p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <KeyRound size={22} strokeWidth={1.5} />
              </span>
            </div>
            <Link href="/admin/change-password" className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/20 dark:bg-white dark:text-slate-950 dark:shadow-white/5 dark:hover:shadow-white/10">
              <KeyRound size={16} /> Đổi mật khẩu ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}