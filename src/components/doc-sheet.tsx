import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Notion-style document view for non-coding deliverables.
 * Renders markdown-ish text (headings, bullets, tables) as a clean page
 * instead of a terminal-looking code block.
 */
export function DocSheet({ content, label }: { content: string; label?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied — now paste it into your file");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-2">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label ?? "Content to paste"}
        </p>
        <Button size="sm" variant="ghost" onClick={copy} className="h-7 gap-1.5 text-xs">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="space-y-3 px-5 py-4 text-sm leading-relaxed">
        {renderBlocks(content)}
      </div>
    </div>
  );
}

type Node = { type: "table"; rows: string[][] } | { type: "lines"; lines: string[] };

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
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
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

function DocText({ lines }: { lines: string[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (!list.length) return;
    out.push(
      <ul key={key} className="ml-4 list-disc space-y-1 text-muted-foreground">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((line, i) => {
    const text = line.trim();
    if (!text) {
      flushList(`l${i}`);
      return;
    }
    const heading = text.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList(`l${i}`);
      const level = heading[1]?.length ?? 1;
      out.push(
        <p
          key={i}
          className={cn(
            "font-display text-foreground",
            level <= 2 ? "text-base font-semibold" : "text-sm font-semibold",
          )}
        >
          {inline(heading[2] ?? "")}
        </p>,
      );
      return;
    }
    const bullet = text.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1] ?? "");
      return;
    }
    flushList(`l${i}`);
    out.push(
      <p key={i} className="text-muted-foreground">
        {inline(text)}
      </p>,
    );
  });
  flushList("last");
  return <>{out}</>;
}

/** Very small inline formatter: **bold** only. */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
