/**
 * Turns the AI's markdown-ish deliverable text into clean HTML so that a
 * "Copy" lands in Word / Google Docs with real headings, bold text, bullets
 * and tables instead of raw asterisks and pipes.
 */

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** **bold**, *italic*, `code`, [link](url) → inline HTML. */
function inlineHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<i>$2</i>")
    .replace(/`([^`]+)`/g, '<span style="font-family:Consolas,monospace">$1</span>');
}

const isSeparator = (cells: string[]) => cells.every((c) => /^:?-{2,}:?$/.test(c));

export function toDocHtml(raw: string): string {
  const lines = (raw || "").replace(/\r/g, "").split("\n");
  const out: string[] = [];

  let list: { ordered: boolean; items: string[] } | null = null;
  let table: string[][] = [];

  const flushList = () => {
    if (!list) return;
    const tag = list.ordered ? "ol" : "ul";
    out.push(`<${tag}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`);
    list = null;
  };

  const flushTable = () => {
    if (!table.length) return;
    const [head, ...body] = table;
    const cell = (v: string, header: boolean) =>
      `<t${header ? "h" : "d"} style="border:1px solid #999;padding:6px;text-align:left;vertical-align:top">${inlineHtml(v)}</t${header ? "h" : "d"}>`;
    out.push(
      `<table style="border-collapse:collapse;width:100%" border="1" cellspacing="0" cellpadding="6">` +
        `<thead><tr>${(head ?? []).map((c) => cell(c, true)).join("")}</tr></thead>` +
        `<tbody>${body.map((r) => `<tr>${r.map((c) => cell(c, false)).join("")}</tr>`).join("")}</tbody></table>`,
    );
    table = [];
  };

  for (const line of lines) {
    const text = line.trim();

    if (text.startsWith("|") && text.includes("|")) {
      flushList();
      const cells = text.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (!isSeparator(cells)) table.push(cells);
      continue;
    }
    flushTable();

    if (!text) {
      flushList();
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(text)) {
      flushList();
      out.push("<hr/>");
      continue;
    }

    if (text.startsWith(">")) {
      flushList();
      out.push(
        `<p style="margin-left:24px;font-style:italic;color:#444">${inlineHtml(text.replace(/^>\s?/, ""))}</p>`,
      );
      continue;
    }

    const heading = text.match(/^(#{1,6})\s+(.*)$/);
    const boldOnly = text.match(/^\*\*(.+?)\*\*:?$/);
    const titleLine = /^[A-Z0-9][^.!?]{2,60}:$/.test(text) && !text.includes("  ");
    if (heading || boldOnly || titleLine) {
      flushList();
      const level = heading ? Math.min(4, heading[1]?.length ?? 1) : boldOnly ? 3 : 4;
      const body = heading ? (heading[2] ?? "") : boldOnly ? (boldOnly[1] ?? "") : text.replace(/:$/, "");
      out.push(`<h${level}>${inlineHtml(body)}</h${level}>`);
      continue;
    }

    const bullet = text.match(/^[-*•]\s+(.*)$/);
    const numbered = text.match(/^(\d+)[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(inlineHtml((bullet ? bullet[1] : numbered?.[2]) ?? ""));
      continue;
    }

    flushList();
    out.push(`<p>${inlineHtml(text)}</p>`);
  }

  flushList();
  flushTable();

  return `<meta charset="utf-8"><div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;color:#000">${out.join("")}</div>`;
}

/** Plain-text fallback: strips the markdown syntax Word would show literally. */
export function toDocPlainText(raw: string): string {
  return (raw || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (/^\|/.test(t)) {
        const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (isSeparator(cells)) return "";
        return cells.join("\t");
      }
      return t
        .replace(/^#{1,6}\s+/, "")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .replace(/^[-*•]\s+/, "• ");
    })
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");
}

/** Copies rich content so Word/Docs keep the formatting; falls back to text. */
export async function copyDocToClipboard(raw: string) {
  const html = toDocHtml(raw);
  const text = toDocPlainText(raw);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return;
    }
  } catch {
    // fall through to plain text
  }
  await navigator.clipboard.writeText(text);
}
