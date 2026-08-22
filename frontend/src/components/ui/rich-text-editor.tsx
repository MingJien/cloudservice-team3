"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { useCallback, useMemo, useRef } from "react";
import type { ComponentProps, RefObject } from "react";
import type ReactQuill from "react-quill-new";
import { uploadImage } from "@/features/content/api";

type QuillEditorProps = ComponentProps<typeof ReactQuill> & {
  editorRef: RefObject<ReactQuill | null>;
};

const QuillEditor = dynamic<QuillEditorProps>(
  async () => {
    const { default: Editor } = await import("react-quill-new");
    return function QuillWithRef({ editorRef, ...props }: QuillEditorProps) {
      return <Editor ref={editorRef} {...props} />;
    };
  },
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-slate-100" /> },
);

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      try {
        const { url } = await uploadImage(file);
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", url);
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Upload ảnh thất bại.");
      }
    };
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler]
  );

  return (
    <div className="rich-text-editor rounded-xl border border-line-200 bg-white overflow-hidden dark:border-white/10 dark:bg-white/5">
      <QuillEditor
        editorRef={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
        .ql-toolbar.ql-snow { border: none; border-bottom: 1px solid var(--line-200, #e2e8f0); }
        .dark .ql-toolbar.ql-snow { border-bottom-color: rgba(255,255,255,0.1); }
        .ql-container.ql-snow { border: none; }
        .ql-editor { min-height: 16rem; font-family: inherit; font-size: 0.875rem; }
        `
      }} />
    </div>
  );
}
