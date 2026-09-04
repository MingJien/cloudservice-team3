"use client";

import { useState, useRef } from "react";
import { uploadImage } from "@/features/content/api";
import { Button } from "./button";
import { UploadCloud } from "lucide-react";

export function ImageUpload({ value, onChange, label, hint }: { value: string; onChange: (url: string) => void; label?: string; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch {
      alert("Tải ảnh thất bại.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2 text-sm font-medium">
      {label && <label>{label}</label>}
      <div className="flex items-center gap-2">
        <input type="text" className="h-10 flex-1 rounded-xl border border-line-200 bg-white px-3 text-sm outline-none focus:border-river-600 focus:ring-2 focus:ring-river-600/15 dark:border-white/10 dark:bg-white/5" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Hoặc nhập URL ảnh trực tiếp..." />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} isLoading={uploading}>
          <UploadCloud size={16} className="mr-2" /> Tải lên
        </Button>
      </div>
      <input type="file" className="hidden" ref={inputRef} accept="image/*" onChange={handleFileChange} />
      {hint && <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span>}
    </div>
  );
}
