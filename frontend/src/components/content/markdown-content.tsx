/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

function inlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\!\[[^\]]*\]\((?:https?:\/\/|\/)[^)]+\)|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\)|\*[^*]+\*)/g;
  const tokens = text.split(pattern).filter(Boolean);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    const image = token.match(/^\!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^)]+)\)$/);
    if (image) return <figure key={key} className="my-3 overflow-hidden rounded-2xl border border-[#d5e5ef] bg-[#f5f9fc] dark:border-white/10 dark:bg-white/[0.03]"><img src={image[2]} alt={image[1]} className="max-h-[34rem] w-full object-cover" loading="lazy" /><figcaption className="px-4 py-2 text-center text-xs text-slate-500">{image[1]}</figcaption></figure>;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("~~") && token.endsWith("~~")) return <del key={key} className="text-slate-500">{token.slice(2, -2)}</del>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={key}>{token.slice(1, -1)}</em>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={key} className="rounded bg-slate-900/5 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10">{token.slice(1, -1)}</code>;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0873b8] underline decoration-[#67c7ed]/60 underline-offset-4 dark:text-cyan-300">{link[1]}</a>;
    return token;
  });
}

function isSpecial(line: string) {
  return /^(#{1,3})\s+|^-\s+|^\d+\.\s+|^>\s+|^```|^\|.+\|$|^---+$/.test(line);
}

export function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) { code.push(lines[index]); index += 1; }
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`code-${index}`} className="overflow-x-auto rounded-2xl border border-white/10 bg-[#07101f] p-4 text-sm leading-6 text-slate-100 shadow-[0_18px_38px_-28px_rgba(0,0,0,.9)]"><code data-language={language || undefined}>{code.join("\n")}</code></pre>);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${index}`} className="my-2 border-0 border-t border-[#cfe0eb] dark:border-white/10" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const children = inlineMarkdown(heading[2], `heading-${index}`);
      if (heading[1].length === 1) blocks.push(<h2 key={`h-${index}`} className="text-3xl font-black tracking-tight text-[#07101f] dark:text-white">{children}</h2>);
      else if (heading[1].length === 2) blocks.push(<h3 key={`h-${index}`} className="text-2xl font-extrabold tracking-tight text-[#0c243b] dark:text-slate-50">{children}</h3>);
      else blocks.push(<h4 key={`h-${index}`} className="text-xl font-bold text-[#12304b] dark:text-slate-100">{children}</h4>);
      index += 1;
      continue;
    }

    if (/^\|.+\|$/.test(line.trim()) && index + 1 < lines.length && /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[index + 1].trim())) {
      const header = line.trim().slice(1, -1).split("|").map((cell) => cell.trim());
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\|.+\|$/.test(lines[index].trim())) {
        rows.push(lines[index].trim().slice(1, -1).split("|").map((cell) => cell.trim()));
        index += 1;
      }
      blocks.push(<div key={`table-${index}`} className="overflow-x-auto rounded-2xl border border-[#d5e5ef] dark:border-white/10"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="bg-[#edf7fc] text-[#12304b] dark:bg-white/[0.07] dark:text-slate-100"><tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="px-4 py-3 font-extrabold">{inlineMarkdown(cell, `th-${index}-${cellIndex}`)}</th>)}</tr></thead><tbody className="divide-y divide-[#e0ebf2] dark:divide-white/[0.07]">{rows.map((row, rowIndex) => <tr key={rowIndex}>{header.map((_, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top">{inlineMarkdown(row[cellIndex] ?? "", `td-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: { content: string; checked?: boolean }[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        const raw = lines[index].replace(/^-\s+/, "");
        const task = raw.match(/^\[([ xX])\]\s+(.+)$/);
        items.push(task ? { content: task[2], checked: task[1].toLowerCase() === "x" } : { content: raw });
        index += 1;
      }
      const isTasks = items.some((item) => item.checked !== undefined);
      blocks.push(<ul key={`ul-${index}`} className={isTasks ? "grid list-none gap-2" : "list-disc space-y-2 pl-6"}>{items.map((item, itemIndex) => <li key={itemIndex} className={item.checked !== undefined ? "flex items-start gap-2.5" : undefined}>{item.checked !== undefined && <span aria-hidden="true" className={`mt-1 grid size-4 shrink-0 place-items-center rounded border text-[0.65rem] ${item.checked ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#9ab8ca]"}`}>{item.checked ? "✓" : ""}</span>}<span>{inlineMarkdown(item.content, `ul-${index}-${itemIndex}`)}</span></li>)}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) { items.push(lines[index].replace(/^\d+\.\s+/, "")); index += 1; }
      blocks.push(<ol key={`ol-${index}`} className="list-decimal space-y-2 pl-6 marker:font-bold marker:text-[#0873b8] dark:marker:text-cyan-300">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ol-${index}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) { quote.push(lines[index].slice(2)); index += 1; }
      blocks.push(<blockquote key={`quote-${index}`} className="rounded-r-2xl border-l-4 border-[#0b8bd8] bg-[#eef8fd] px-5 py-4 font-medium italic text-[#24445f] dark:border-[#67e8f9] dark:bg-[#22d3ee]/[0.07] dark:text-slate-200">{inlineMarkdown(quote.join(" "), `quote-${index}`)}</blockquote>);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isSpecial(lines[index])) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push(<p key={`p-${index}`}>{inlineMarkdown(paragraph.join(" "), `p-${index}`)}</p>);
  }

  return <div className={`grid gap-5 text-base leading-8 text-slate-700 dark:text-slate-200 ${className}`}>{blocks}</div>;
}
