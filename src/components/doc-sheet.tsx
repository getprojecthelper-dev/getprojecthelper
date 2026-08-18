import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { copyDocToClipboard } from "@/lib/doc-html";
import { cn } from "@/lib/utils";

/**
 * Notion / Google-Docs style page for non-coding deliverables.
 *
 * Project management students never see a terminal here: the generated text is
 * parsed as a document — headings, bold, bullets, numbered lists, quotes,
 * dividers and tables — and rendered as a real page they can read and paste.
 */
export function DocSheet({ content, label }: { content: string; label?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      // Copies rich HTML so Word / Google Docs keep headings, bold and tables.
      await copyDocToClipboard(content);
      setCopied(true);
      toast.success("Copied with formatting — paste straight into Word");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text and copy manually");
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-2">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label ?? "Document content"}
        </p>
        <Button size="sm" variant="ghost" onClick={copy} className="h-7 gap-1.5 text-xs">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy for Word"}
        </Button>
      </div>


      {/* the page itself */}
      <div className="px-6 py-6 sm:px-10 sm:py-8">
        <article className="doc-page mx-auto max-w-[46rem] space-y-4 text-[15px] leading-7 text-foreground">
          {renderBlocks(content)}
        </article>
      </div>
    </div>
  );
}

type Node =
  | { type: "table"; rows: string[][] }
  | { type: "lines"; lines: string[] };

function renderBlocks(raw: string) {
  const lines = raw.replace(/\r/g, "").split("\n");
  const nodes: Node[] = [];
  let buffer: string[] = [];
  let table: string[][] = [];

  const flushLines = () => {
    if (buffer.length) nodes.push({ type: "lines", lines: buffer });
    buffer = [];
  };
  const flushTable = () => {
    if (table.length) nodes.push({ type: "table", rows: table });
    table = [];
  };

  for (const line of lines) {
    const isRow = line.trim().startsWith("|") && line.includes("|");
    if (isRow) {
      flushLines();
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // header separator
      table.push(cells);
    } else {
      flushTable();
      buffer.push(line);
    }
  }
  flushLines();
  flushTable();

  return nodes.map((node, i) =>
    node.type === "table" ? (
      <DocTable key={i} rows={node.rows} />
    ) : (
      <DocText key={i} lines={node.lines} />
    ),
  );
}

function DocTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        {head ? (
          <thead>
            <tr className="bg-muted/60">
              {head.map((cell, i) => (
                <th
                  key={i}
                  className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {inline(cell)}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="odd:bg-muted/20">
              {row.map((cell, c) => (
                <td key={c} className="border-b border-border/60 px-3 py-2 align-top">
                  {inline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ListItem = { text: string; ordered: boolean; marker?: string };

function DocText({ lines }: { lines: string[] }) {
  const out: React.ReactNode[] = [];
  let list: ListItem[] = [];
  let quote: string[] = [];

  const flushList = (key: string) => {
    if (!list.length) return;
    const ordered = list[0]?.ordered ?? false;
    const items = list;
    out.push(
      ordered ? (
        <ol key={key} className="ml-5 list-decimal space-y-1.5 marker:font-medium marker:text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="pl-1">
              {inline(item.text)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="ml-5 list-disc space-y-1.5 marker:text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="pl-1">
              {inline(item.text)}
            </li>
          ))}
        </ul>
      ),
    );
    list = [];
  };

  const flushQuote = (key: string) => {
    if (!quote.length) return;
    const text = quote.join(" ");
    out.push(
      <blockquote
        key={key}
        className="border-l-2 border-primary/50 bg-primary/5 py-2 pl-4 pr-3 text-[15px] italic text-muted-foreground"
      >
        {inline(text)}
      </blockquote>,
    );
    quote = [];
  };

  const flushAll = (key: string) => {
    flushList(`${key}-l`);
    flushQuote(`${key}-q`);
  };

  lines.forEach((line, i) => {
    const text = line.trim();
    if (!text) {
      flushAll(`b${i}`);
      return;
    }

    // divider
    if (/^([-*_])\1{2,}$/.test(text)) {
      flushAll(`b${i}`);
      out.push(<hr key={i} className="border-border" />);
      return;
    }

    // quote
    if (text.startsWith(">")) {
      flushList(`b${i}-l`);
      quote.push(text.replace(/^>\s?/, ""));
      return;
    }

    // markdown heading
    const heading = text.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushAll(`b${i}`);
      out.push(headingNode(heading[1]?.length ?? 1, heading[2] ?? "", i));
      return;
    }

    // a lone bold line, or a short "Title:" line, reads as a heading in docs
    const boldOnly = text.match(/^\*\*(.+)\*\*:?$/);
    if (boldOnly) {
      flushAll(`b${i}`);
      out.push(headingNode(3, boldOnly[1] ?? "", i));
      return;
    }
    if (/^[A-Z0-9][^.!?]{2,60}:$/.test(text) && !text.includes("  ")) {
      flushAll(`b${i}`);
      out.push(headingNode(4, text.replace(/:$/, ""), i));
      return;
    }

    // list items (bullets keep bullets, numbers keep numbers)
    const bullet = text.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      flushQuote(`b${i}-q`);
      list.push({ text: bullet[1] ?? "", ordered: false });
      return;
    }
    const numbered = text.match(/^(\d+)[.)]\s+(.*)$/);
    if (numbered) {
      flushQuote(`b${i}-q`);
      list.push({ text: numbered[2] ?? "", ordered: true });
      return;
    }

    flushAll(`b${i}`);
    out.push(
      <p key={i} className="text-foreground/90">
        {inline(text)}
      </p>,
    );
  });

  flushAll("last");
  return <>{out}</>;
}

function headingNode(level: number, text: string, key: number) {
  const cls =
    level <= 1
      ? "font-display text-2xl font-semibold tracking-tight"
      : level === 2
        ? "font-display text-xl font-semibold tracking-tight"
        : level === 3
          ? "font-display text-base font-semibold"
          : "text-sm font-semibold uppercase tracking-wide text-muted-foreground";
  return (
    <p key={key} className={cn("pt-1 text-foreground", cls)}>
      {inline(text)}
    </p>
  );
}

/** Inline formatting: **bold**, *italic*, `code`, [link](url). */
function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <span key={i} className="rounded bg-muted px-1 py-0.5 text-[0.85em] text-foreground">
          {part.slice(1, -1)}
        </span>
      );
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
