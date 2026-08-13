/**
 * Works out which everyday office file a generated deliverable belongs in,
 * so non-technical students always know where to paste what they just got.
 */

export type OfficeApp = "excel" | "word" | "powerpoint";

export interface FileGuidance {
  app: OfficeApp;
  /** e.g. "Excel (or Google Sheets)" */
  appLabel: string;
  /** e.g. "Paste into a new sheet" */
  action: string;
  /** Suggested file / sheet / section name. */
  target: string;
}

const SHEET_HINTS = [
  "wbs",
  "work breakdown",
  "schedule",
  "gantt",
  "timeline",
  "budget",
  "cost",
  "resource",
  "raci",
  "matrix",
  "risk register",
  "risk",
  "tracker",
  "log",
  "milestone",
  "estimate",
];

const SLIDE_HINTS = ["slide", "presentation", "deck", "viva", "pitch"];

const looksLikeTable = (text: string) => {
  const rows = text.split("\n").filter((l) => l.includes("|"));
  return rows.length >= 2;
};

const titleCase = (value: string) =>
  value
    .replace(/[^a-z0-9 ]/gi, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function getFileGuidance(
  blockTitle: string,
  sectionTitle: string,
  content: string,
): FileGuidance {
  const haystack = `${blockTitle} ${sectionTitle}`.toLowerCase();
  const name = titleCase(blockTitle || sectionTitle) || "Project";

  if (SLIDE_HINTS.some((h) => haystack.includes(h))) {
    return {
      app: "powerpoint",
      appLabel: "PowerPoint (or Google Slides)",
      action: "Add as a new slide in",
      target: `${name} — presentation`,
    };
  }

  if (looksLikeTable(content) || SHEET_HINTS.some((h) => haystack.includes(h))) {
    return {
      app: "excel",
      appLabel: "Excel (or Google Sheets)",
      action: "Paste into a new sheet named",
      target: name,
    };
  }

  return {
    app: "word",
    appLabel: "Word (or Google Docs)",
    action: "Add as a section in your document named",
    target: name,
  };
}
