"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Bold, CheckSquare, Code2, Columns2, Eye, Heading2, Heading3, ImagePlus, Italic,
  Link2, List, ListOrdered, Maximize2, Minimize2, Minus, Pilcrow, Quote,
  Strikethrough, Table2,
} from "lucide-react";
import { MarkdownContent } from "@/components/content/markdown-content";
import { cn } from "@/lib/cn";

type MarkdownEditorProps = { value: string; onChange: (value: string) => void };
type Selection = { start: number; end: number; text: string };
type EditorMode = "write" | "split" | "preview";

const toolbarButton = "inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2.5 text-xs font-bold text-slate-600 transition hover:-translate-y-0.5 hover:border-[#80bddc]/45 hover:bg-[#eaf7fd] hover:text-[#075f9d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b8bd8] dark:text-slate-300 dark:hover:border-[#67e8f9]/30 dark:hover:bg-[#22d3ee]/10 dark:hover:text-[#a5f3fc]";

function ToolButton({ label, shortcut, children, onClick }: { label: string; shortcut?: string; children: ReactNode; onClick: () => void }) {
  const title = shortcut ? `${label} (${shortcut})` : label;
  return <button type="button" className={toolbarButton} title={title} aria-label={title} onClick={onClick}>{children}</button>;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<EditorMode>("write");
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!fullScreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [fullScreen]);

  const stats = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/u).length : 0;
    return { words, minutes: Math.max(1, Math.ceil(words / 220)), characters: value.length };
  }, [value]);

  const selection = useCallback((): Selection => {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? value.length;
    const end = editor?.selectionEnd ?? start;
    return { start, end, text: value.slice(start, end) };
  }, [value]);

  const commit = useCallback((start: number, end: number, replacement: string, nextStart: number, nextEnd: number) => {
    onChange(`${value.slice(0, start)}${replacement}${value.slice(end)}`);
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(nextStart, nextEnd);
    });
  }, [onChange, value]);

  const wrap = useCallback((prefix: string, suffix: string, placeholder: string) => {
    const current = selection();
    const content = current.text || placeholder;
    const replacement = `${prefix}${content}${suffix}`;
    const contentStart = current.start + prefix.length;
    commit(current.start, current.end, replacement, contentStart, contentStart + content.length);
  }, [commit, selection]);

  const prefixLines = useCallback((prefix: string | ((index: number) => string), placeholder: string) => {
    const current = selection();
    const lineStart = current.start === 0 ? 0 : value.lastIndexOf("\n", current.start - 1) + 1;
    const nextLineBreak = value.indexOf("\n", current.end);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const source = value.slice(lineStart, lineEnd) || placeholder;
    const replacement = source.split("\n").map((line, index) => `${typeof prefix === "function" ? prefix(index) : prefix}${line}`).join("\n");
    commit(lineStart, lineEnd, replacement, lineStart, lineStart + replacement.length);
  }, [commit, selection, value]);

  const insertBlock = useCallback((template: string, selectedPlaceholder: string) => {
    const current = selection();
    const selected = current.text || selectedPlaceholder;
    const block = template.replace("{{selection}}", selected);
    const leading = current.start > 0 && value[current.start - 1] !== "\n" ? "\n\n" : "";
    const trailing = current.end < value.length && value[current.end] !== "\n" ? "\n\n" : "";
    const replacement = `${leading}${block}${trailing}`;
    const selectedOffset = block.indexOf(selected);
    const nextStart = current.start + leading.length + Math.max(0, selectedOffset);
    commit(current.start, current.end, replacement, nextStart, nextStart + selected.length);
  }, [commit, selection, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "b") { event.preventDefault(); wrap("**", "**", "nội dung nổi bật"); }
    if (modifier && event.key.toLowerCase() === "i") { event.preventDefault(); wrap("*", "*", "nội dung nhấn mạnh"); }
    if (modifier && event.key.toLowerCase() === "k") { event.preventDefault(); wrap("[", "](https://example.com)", "nhãn liên kết"); }
    if (event.key === "Tab") { event.preventDefault(); const current = selection(); commit(current.start, current.end, "  ", current.start + 2, current.start + 2); }
    if (event.key === "Escape" && fullScreen) setFullScreen(false);
  };

  const showEditor = mode !== "preview";
  const showPreview = mode !== "write";

  return (
    <div className={cn(
      "overflow-hidden rounded-[1.15rem] border border-[#ccdeeb] bg-white shadow-[0_22px_54px_-40px_rgba(7,64,103,.5),inset_0_1px_0_rgba(255,255,255,.95)] transition focus-within:border-[#0b8bd8]/65 focus-within:ring-4 focus-within:ring-[#0b8bd8]/10 dark:border-white/10 dark:bg-[#071324] dark:shadow-[0_28px_70px_-46px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.05)] dark:focus-within:border-[#67e8f9]/45 dark:focus-within:ring-[#22d3ee]/10",
      fullScreen && "fixed inset-3 z-[70] flex flex-col rounded-2xl shadow-2xl sm:inset-6",
    )}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8e7f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f3f9fd_100%)] px-2 py-2 dark:border-white/10 dark:bg-[linear-gradient(180deg,#10213a_0%,#0a182c_100%)]">
        <div className="flex items-center gap-1 rounded-xl border border-[#d5e5ef] bg-white/90 p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.045]" aria-label="Chế độ biên tập">
          {(["write", "split", "preview"] as const).map((item) => {
            const labels = { write: "Viết", split: "Chia đôi", preview: "Xem trước" };
            const Icon = item === "write" ? Pilcrow : item === "split" ? Columns2 : Eye;
            return <button key={item} type="button" onClick={() => setMode(item)} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition", mode === item ? "bg-[#075f9d] text-white shadow-[0_8px_18px_-10px_rgba(7,95,157,.9)] dark:bg-[#0b8bd8]" : "text-slate-500 hover:bg-[#edf7fc] dark:text-slate-300 dark:hover:bg-white/[0.07]")}><Icon size={14} />{labels[item]}</button>;
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300 sm:inline">Markdown an toàn</span>
          <button type="button" className={toolbarButton} onClick={() => setFullScreen((current) => !current)} aria-label={fullScreen ? "Thoát toàn màn hình" : "Soạn thảo toàn màn hình"} title={fullScreen ? "Thoát toàn màn hình (Esc)" : "Toàn màn hình"}>{fullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
      </div>

      {showEditor && <div className="flex flex-wrap items-center gap-1 border-b border-[#d8e7f0] bg-[#f9fcfe] p-2 dark:border-white/10 dark:bg-white/[0.025]" role="toolbar" aria-label="Công cụ định dạng bài viết">
        <ToolButton label="Tiêu đề cấp 2" onClick={() => prefixLines("## ", "Tiêu đề phần")}><Heading2 size={16} /></ToolButton>
        <ToolButton label="Tiêu đề cấp 3" onClick={() => prefixLines("### ", "Tiêu đề nhỏ")}><Heading3 size={16} /></ToolButton>
        <span className="mx-1 h-6 w-px bg-[#d5e5ef] dark:bg-white/10" aria-hidden="true" />
        <ToolButton label="In đậm" shortcut="Ctrl+B" onClick={() => wrap("**", "**", "nội dung nổi bật")}><Bold size={16} /></ToolButton>
        <ToolButton label="In nghiêng" shortcut="Ctrl+I" onClick={() => wrap("*", "*", "nội dung nhấn mạnh")}><Italic size={16} /></ToolButton>
        <ToolButton label="Gạch ngang" onClick={() => wrap("~~", "~~", "nội dung đã thay đổi")}><Strikethrough size={16} /></ToolButton>
        <ToolButton label="Mã trong dòng" onClick={() => wrap("`", "`", "tên_lệnh")}><Code2 size={16} /></ToolButton>
        <span className="mx-1 h-6 w-px bg-[#d5e5ef] dark:bg-white/10" aria-hidden="true" />
        <ToolButton label="Liên kết HTTPS" shortcut="Ctrl+K" onClick={() => wrap("[", "](https://example.com)", "nhãn liên kết")}><Link2 size={16} /></ToolButton>
        <ToolButton label="Ảnh minh họa" onClick={() => insertBlock("![{{selection}}](https://example.com/hinh-minh-hoa.jpg)", "Mô tả ảnh")}><ImagePlus size={16} /></ToolButton>
        <ToolButton label="Danh sách" onClick={() => prefixLines("- ", "Mục danh sách")}><List size={16} /></ToolButton>
        <ToolButton label="Danh sách đánh số" onClick={() => prefixLines((index) => `${index + 1}. `, "Bước thực hiện")}><ListOrdered size={16} /></ToolButton>
        <ToolButton label="Danh sách kiểm tra" onClick={() => prefixLines("- [ ] ", "Công việc cần hoàn tất")}><CheckSquare size={16} /></ToolButton>
        <ToolButton label="Trích dẫn" onClick={() => prefixLines("> ", "Nội dung cần lưu ý")}><Quote size={16} /></ToolButton>
        <ToolButton label="Khối mã" onClick={() => insertBlock("```text\n{{selection}}\n```", "nội dung mã")}><Code2 size={16} /><span className="hidden lg:inline">Block</span></ToolButton>
        <ToolButton label="Bảng dữ liệu" onClick={() => insertBlock("| Hạng mục | Thông số |\n| --- | --- |\n| {{selection}} | Nội dung |", "Tên hạng mục")}><Table2 size={16} /></ToolButton>
        <ToolButton label="Đường phân cách" onClick={() => insertBlock("---", "")}><Minus size={16} /></ToolButton>
      </div>}

      <div className={cn("grid min-h-0 flex-1", mode === "split" && "lg:grid-cols-2")}>
        {showEditor && <div className={cn("min-w-0", mode === "split" && "border-b border-[#d8e7f0] dark:border-white/10 lg:border-b-0 lg:border-r")}>
          <div className="border-b border-[#e3edf4] px-5 py-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#567087] dark:border-white/[0.07] dark:text-slate-400">Bản thảo</div>
          <textarea ref={editorRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleKeyDown} spellCheck className={cn("min-h-[26rem] w-full resize-y bg-transparent px-5 py-5 font-sans text-[0.94rem] leading-7 text-[#132a42] outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500", fullScreen && "h-[calc(100vh-15rem)] resize-none")} placeholder={"## Mở đầu\n\nViết nội dung thực tế, có số liệu và dẫn nguồn..."} aria-label="Nội dung bài viết bằng Markdown" />
        </div>}
        {showPreview && <section className={cn("min-w-0 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfd_100%)] dark:bg-[linear-gradient(180deg,#0a182b_0%,#071324_100%)]", fullScreen && "max-h-[calc(100vh-10rem)]")} aria-label="Bản xem trước bài viết">
          <div className="border-b border-[#e3edf4] px-5 py-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#567087] dark:border-white/[0.07] dark:text-slate-400">Bản xem trước trực tiếp</div>
          <div className="p-5 sm:p-7">{value.trim() ? <MarkdownContent content={value} /> : <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[#bfd7e6] bg-[#f4f9fc] p-8 text-center text-sm leading-6 text-slate-500 dark:border-white/10 dark:bg-white/[0.025]">Nội dung đã định dạng sẽ xuất hiện ở đây.</div>}</div>
        </section>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 border-t border-[#d8e7f0] bg-[#f5f9fc] px-4 py-2.5 text-[0.7rem] leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-400 sm:px-5">
        <span>Lưu theo nút “Lưu bài viết” · HTML thô không được thực thi</span>
        <span className="flex flex-wrap gap-3 font-mono tabular-nums"><span>{stats.words.toLocaleString("vi-VN")} từ</span><span>~{stats.minutes} phút đọc</span><span>{stats.characters.toLocaleString("vi-VN")} ký tự</span></span>
      </div>
    </div>
  );
}
