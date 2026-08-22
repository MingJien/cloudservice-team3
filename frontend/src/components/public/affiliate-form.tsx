"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createAffiliate } from "@/features/affiliates/api";
import { Container } from "@/components/layout/container";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export function AffiliateForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", channel: "", note: "" });
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setForm((current) => ({ ...current, phone: digits }));
  }

  const phoneValidation = useMemo(() => {
    if (!form.phone && !phoneFocused) {
      return { hint: "Gồm đúng 10 chữ số (không bắt buộc)", error: undefined };
    }
    if (!form.phone && phoneFocused) {
      return { hint: undefined, error: undefined };
    }
    if (!form.phone.startsWith("0")) {
      return { error: "Số điện thoại phải bắt đầu bằng số 0 (ví dụ: 0912345678).", hint: undefined };
    }
    if (form.phone.length < 10) {
      return { hint: `Đang nhập: ${form.phone.length}/10 số (còn thiếu ${10 - form.phone.length} số)`, error: undefined };
    }
    return { hint: "✓ Số điện thoại hợp lệ (10 số)", error: undefined };
  }, [form.phone, phoneFocused]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      setError("Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createAffiliate({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        websiteOrChannel: form.channel.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể gửi đăng ký.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="py-12 md:py-16">
      <Container>
        <PageHeading
          title="Đối tác Affiliate"
          description="Giới thiệu khách hàng phù hợp với hệ sinh thái MekongNode và nhận chính sách hoa hồng theo thỏa thuận."
        />
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-river-700">Chính sách minh bạch</p>
            <h2 className="mt-3 text-2xl font-bold">Đồng hành lâu dài</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              <li>• Có người phụ trách xác nhận từng hồ sơ.</li>
              <li>• Trạng thái hồ sơ được cập nhật theo luồng.</li>
              <li>• Không yêu cầu thanh toán để đăng ký.</li>
            </ul>
          </Card>
          <Card>
            {sent ? (
              <div className="py-8 text-center">
                <p className="font-bold text-success-600">Đã tiếp nhận hồ sơ affiliate thành công.</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Đội ngũ sẽ liên hệ để trao đổi chính sách và hỗ trợ kích hoạt.
                </p>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={submit}>
                {error && <ErrorState description={error} />}
                <Input
                  label="Họ và tên"
                  name="name"
                  required
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                />
                <Input
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="nhập đúng 10 chữ số"
                  value={form.phone}
                  error={phoneValidation.error}
                  hint={phoneValidation.hint}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => {
                    setPhoneFocused(false);
                  }}
                />
                <Input
                  label="Website / kênh giới thiệu"
                  name="channel"
                  type="url"
                  value={form.channel}
                  onChange={(event) => update("channel", event.target.value)}
                />
                <label className="grid gap-2 text-sm font-medium">
                  Mô tả kênh
                  <textarea
                    maxLength={2000}
                    className="min-h-28 rounded-xl border border-line-200 bg-white px-3 py-2 outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15 dark:border-white/10 dark:bg-white/5"
                    value={form.note}
                    onChange={(event) => update("note", event.target.value)}
                  />
                </label>
                <Button type="submit" isLoading={loading}>
                  Gửi đăng ký
                </Button>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </main>
  );
}
