/**
 * Everyday office files for non-coding domains.
 *
 * The AI tells the student which file a deliverable belongs in (e.g.
 * "Schedule.xlsx — sheet: Gantt"). We parse that, de-duplicate it per project
 * and hand the student a real Word / Excel file — empty to start from, or
 * already filled with the step's table data.
 *
 * Spreadsheets are written with SheetJS so Excel never shows the
 * "we found a problem with some content" repair prompt.
 */

import JSZip from "jszip";

export type OfficeKind = "word" | "excel" | "powerpoint";

export interface FileSpec {
  /** Clean file name including the extension, e.g. "Schedule.xlsx". */
  fileName: string;
  /** Base name without extension. */
  baseName: string;
  kind: OfficeKind;
  /** The sheet / section inside the file, when the AI named one. */
  part?: string;
  /** "sheet" for Excel, "slide" for PowerPoint, "section" for Word. */
  partLabel: string;
}

const EXT: Record<OfficeKind, string> = {
  word: "docx",
  excel: "xlsx",
  powerpoint: "pptx",
};

const PART_LABEL: Record<OfficeKind, string> = {
  word: "section",
  excel: "sheet",
  powerpoint: "slide",
};

const clean = (v: string) =>
  v.replace(/[\\/:*?"<>|[\]]/g, " ").replace(/\s+/g, " ").trim();

function kindFor(raw: string, tableLike: boolean): OfficeKind {
  const l = raw.toLowerCase();
  if (/\.(xlsx|xls|csv)\b/.test(l) || /(sheet|spreadsheet|excel|workbook)/.test(l))
    return "excel";
  if (/\.(pptx|ppt)\b/.test(l) || /(slide|presentation|deck|powerpoint)/.test(l))
    return "powerpoint";
  if (/(register|log\b|matrix|budget|tracker|gantt|wbs|schedule|estimate|raci)/.test(l)) return "excel";
  if (/\.(docx|doc)\b/.test(l) || /(word|document|doc\b|report|charter|plan|memo)/.test(l))
    return "word";
  return tableLike ? "excel" : "word";
}

/**
 * Turn whatever the AI wrote ("Schedule.xlsx — sheet: Gantt", "Project
 * Charter", "Risk Register (Excel)") into one predictable file spec.
 */
export function parseFileSpec(raw: string, content = ""): FileSpec {
  const source = (raw || "Project Document").trim();
  // Anything after an em dash / hyphen / parenthesis usually names the sheet.
  const [head, ...rest] = source.split(/\s+[—–-]\s+|\s*\|\s*/);
  const tail = rest.join(" ");
  const tableLike = content.split("\n").filter((l) => l.includes("|")).length >= 2;
  const kind = kindFor(source, tableLike);

  let baseName = clean((head ?? source).replace(/\.(docx?|xlsx?|pptx?|csv)$/i, ""));
  if (!baseName) baseName = "Project Document";

  const partMatch = tail.match(/(?:sheet|tab|section|slide)\s*[:\-]?\s*(.+)$/i);
  const part = partMatch?.[1] ? clean(partMatch[1]) : tail ? clean(tail) : undefined;

  return {
    fileName: `${baseName}.${EXT[kind]}`,
    baseName,
    kind,
    ...(part ? { part } : {}),
    partLabel: PART_LABEL[kind],
  };
}

/* ------------------------------------------------------------------ */
/* Empty Word file (small hand-built package)                          */
/* ------------------------------------------------------------------ */

const CT_BASE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>`;

const rels = (target: string, type: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${type}" Target="${target}"/>
</Relationships>`;

function docx(): JSZip {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `${CT_BASE}
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    rels(
      "word/document.xml",
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
    ),
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p/><w:sectPr/></w:body></w:document>`,
  );
  return zip;
}

/* ------------------------------------------------------------------ */
/* Tables → a real spreadsheet with the data already filled in         */
/* ------------------------------------------------------------------ */

export interface DataTable {
  /** Optional caption/heading that appeared just above the table. */
  title?: string;
  headers: string[];
  rows: string[][];
}

const stripInline = (v: string) =>
  v
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^\s*\*(.+)\*\s*$/, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();

/**
 * Pulls every markdown-ish table out of a deliverable's text.
 *
 * Anything that looks like a pipe row counts, so nothing is silently dropped:
 * a table only needs a header row to be included.
 */
export function parseMarkdownTables(content: string): DataTable[] {
  const tables: DataTable[] = [];
  let current: string[][] = [];
  let heading = "";
  let lastText = "";

  const flush = () => {
    if (current.length) {
      const [headers, ...rows] = current;
      const width = Math.max(...current.map((r) => r.length));
      const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
      tables.push({
        ...(heading ? { title: heading } : {}),
        headers: pad(headers ?? []),
        rows: rows.map(pad),
      });
    }
    current = [];
    heading = "";
  };

  for (const line of (content || "").replace(/\r/g, "").split("\n")) {
    const t = line.trim();
    if (t.startsWith("|") && t.includes("|")) {
      if (!current.length) heading = lastText;
      const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => stripInline(c));
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
      current.push(cells);
    } else {
      if (current.length) flush();
      if (t) lastText = t.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/:$/, "");
    }
  }
  flush();

  // Keep everything with a header row — a one-row table is still real data.
  return tables.filter((t) => t.headers.filter(Boolean).length > 0);
}

const sheetTitle = (raw: string, used: Set<string>) => {
  let name = (clean(raw) || "Sheet1").slice(0, 31);
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` ${n++}`;
    name = `${name.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(name.toLowerCase());
  return name;
};

/** Builds a workbook whose sheets already contain every row of the step. */
export async function buildFilledWorkbook(
  sheetName: string,
  tables: DataTable[],
): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const used = new Set<string>();

  tables.forEach((table, i) => {
    const aoa: (string | number)[][] = [table.headers, ...table.rows].map((row) =>
      row.map((cell) => {
        const raw = (cell ?? "").trim();
        const asNumber = Number(raw.replace(/,/g, ""));
        return raw !== "" && !Number.isNaN(asNumber) && /^[-+]?[\d,]*\.?\d+$/.test(raw)
          ? asNumber
          : raw;
      }),
    );
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    sheet["!cols"] = (table.headers ?? []).map((_, c) => ({
      wch: Math.min(48, Math.max(12, ...aoa.map((r) => String(r[c] ?? "").length + 2))),
    }));
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    const label =
      tables.length > 1 ? table.title || `${sheetName} ${i + 1}` : table.title || sheetName;
    XLSX.utils.book_append_sheet(book, sheet, sheetTitle(label, used));
  });

  return XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

/** Downloads a spreadsheet pre-filled with the step's table data. */
export async function downloadFilledSpreadsheet(spec: FileSpec, tables: DataTable[]) {
  const buffer = await buildFilledWorkbook(spec.part ?? spec.baseName, tables);
  triggerDownload(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${spec.baseName}.xlsx`,
  );
}

/** Builds an empty file for the spec and triggers a browser download. */
export async function downloadEmptyOfficeFile(spec: FileSpec) {
  if (spec.kind === "excel") {
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([[]]),
      sheetTitle(spec.part ?? spec.baseName, new Set()),
    );
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    triggerDownload(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      spec.fileName,
    );
    return;
  }

  // PowerPoint packages are heavy; a blank Word outline is more useful there.
  const blob = await docx().generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  triggerDownload(
    blob,
    spec.kind === "powerpoint" ? `${spec.baseName} — slide notes.docx` : spec.fileName,
  );
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
