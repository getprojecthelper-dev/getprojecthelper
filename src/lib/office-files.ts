/**
 * Everyday office files for non-coding domains.
 *
 * The AI tells the student which file a deliverable belongs in (e.g.
 * "Schedule.xlsx — sheet: Gantt"). We parse that, de-duplicate it per project
 * and can hand the student a real, EMPTY Word / Excel / PowerPoint file to
 * start from, so nobody has to touch a terminal or guess file names.
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
  v.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();

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
/* Empty file builders (pure JS, no server needed)                     */
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

function xlsx(sheetName: string): JSZip {
  const zip = new JSZip();
  const name = clean(sheetName).slice(0, 31) || "Sheet1";
  zip.file(
    "[Content_Types].xml",
    `${CT_BASE}
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    rels(
      "xl/workbook.xml",
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
    ),
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name.replace(/&/g, "&amp;").replace(/</g, "&lt;")}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    rels(
      "worksheets/sheet1.xml",
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet",
    ),
  );
  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>`,
  );
  return zip;
}

/* ------------------------------------------------------------------ */
/* Tables → a real spreadsheet with the data already filled in         */
/* ------------------------------------------------------------------ */

export interface DataTable {
  headers: string[];
  rows: string[][];
}

/** Pulls every markdown-ish table out of a deliverable's text. */
export function parseMarkdownTables(content: string): DataTable[] {
  const tables: DataTable[] = [];
  let current: string[][] = [];

  const flush = () => {
    if (current.length >= 1) {
      const [headers, ...rows] = current;
      tables.push({ headers: headers ?? [], rows });
    }
    current = [];
  };

  for (const line of (content || "").replace(/\r/g, "").split("\n")) {
    const t = line.trim();
    if (t.startsWith("|") && t.includes("|")) {
      const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // separator row
      current.push(cells.map((c) => c.replace(/\*\*/g, "").replace(/`/g, "")));
    } else if (current.length) {
      flush();
    }
  }
  flush();
  return tables.filter((t) => t.headers.length > 1 && t.rows.length > 0);
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const colLetter = (index: number) => {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
};

function sheetXml(rows: string[][]) {
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          const ref = `${colLetter(c)}${r + 1}`;
          const num = value !== "" && !Number.isNaN(Number(value.replace(/,/g, "")));
          if (num) return `<c r="${ref}"><v>${Number(value.replace(/,/g, ""))}</v></c>`;
          const style = r === 0 ? ' s="1"' : "";
          return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  const widths = (rows[0] ?? [])
    .map((_, c) => {
      const width = Math.min(
        44,
        Math.max(12, ...rows.map((r) => (r[c] ?? "").length + 4)),
      );
      return `<col min="${c + 1}" max="${c + 1}" width="${width}" customWidth="1"/>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${widths}</cols><sheetData>${body}</sheetData></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFEFEF"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`;

/** Builds a workbook whose sheets already contain the step's table data. */
export function buildFilledXlsx(sheetName: string, tables: DataTable[]): JSZip {
  const zip = new JSZip();
  const sheets = tables.map((table, i) => ({
    name:
      (clean(tables.length > 1 ? `${sheetName} ${i + 1}` : sheetName) || "Sheet1").slice(0, 31),
    rows: [table.headers, ...table.rows],
  }));

  zip.file(
    "[Content_Types].xml",
    `${CT_BASE}
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("\n")}
</Types>`,
  );
  zip.file(
    "_rels/.rels",
    rels(
      "xl/workbook.xml",
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
    ),
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map(
        (s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
  )
  .join("\n")}
<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  );
  zip.file("xl/styles.xml", STYLES);
  sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows)));
  return zip;
}

/** Downloads a spreadsheet pre-filled with the step's table data. */
export async function downloadFilledSpreadsheet(spec: FileSpec, tables: DataTable[]) {
  const zip = buildFilledXlsx(spec.part ?? spec.baseName, tables);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${spec.baseName}.xlsx`);
}

/** Builds the empty package for a spec (exported for tests). */
export function buildEmptyOfficeZip(spec: FileSpec): JSZip {
  return spec.kind === "excel" ? xlsx(spec.part ?? spec.baseName) : docx();
}

/** Builds an empty file for the spec and triggers a browser download. */
export async function downloadEmptyOfficeFile(spec: FileSpec) {
  if (spec.kind === "powerpoint") {
    // PowerPoint packages are heavy; a blank Word outline is more useful here.
    const blob = await docx().generateAsync({ type: "blob" });
    triggerDownload(blob, `${spec.baseName} — slide notes.docx`);
    return;
  }
  const zip = spec.kind === "excel" ? xlsx(spec.part ?? spec.baseName) : docx();
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, spec.fileName);
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
