import type { ReactNode } from "react";

function inlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={key} className="rounded bg-slate-900/5 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10">{token.slice(1, -1)}</code>;
    const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-river-700 underline underline-offset-2 dark:text-cyan-300">{link[1]}</a>;
    return token;
  });
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
      index += 1;
      blocks.push(<pre key={`code-${index}`} className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code data-language={language || undefined}>{code.join("\n")}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const children = inlineMarkdown(heading[2], `heading-${index}`);
      if (heading[1].length === 1) blocks.push(<h2 key={`h-${index}`} className="text-3xl font-bold">{children}</h2>);
      else if (heading[1].length === 2) blocks.push(<h3 key={`h-${index}`} className="text-2xl font-bold">{children}</h3>);
      else blocks.push(<h4 key={`h-${index}`} className="text-xl font-bold">{children}</h4>);
      index += 1;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) { items.push(lines[index].replace(/^-\s+/, "")); index += 1; }
      blocks.push(<ul key={`ul-${index}`} className="list-disc space-y-2 pl-6">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ul-${index}-${itemIndex}`)}</li>)}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) { items.push(lines[index].replace(/^\d+\.\s+/, "")); index += 1; }
      blocks.push(<ol key={`ol-${index}`} className="list-decimal space-y-2 pl-6">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineMarkdown(item, `ol-${index}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(<blockquote key={`quote-${index}`} className="border-l-4 border-river-500 bg-ice-100/60 px-5 py-3 italic dark:bg-white/5">{inlineMarkdown(line.slice(2), `quote-${index}`)}</blockquote>);
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^-\s+|^\d+\.\s+|^>\s+|^```/.test(lines[index])) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push(<p key={`p-${index}`}>{inlineMarkdown(paragraph.join(" "), `p-${index}`)}</p>);
  }

  return <div className={`grid gap-5 text-base leading-8 text-slate-700 dark:text-slate-200 ${className}`}>{blocks}</div>;
}
