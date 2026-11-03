import { buildNotebook, notebookCellIndex, notebookPath } from "@/lib/notebook";

export interface WorkspaceEntry {
  path: string;
  name: string;
  type: "file" | "directory";
  content: string;
}

export interface WorkspaceSection {
  position: number;
  structure?: string | null;
  files?: { path: string; content: string }[];
  blocks?: { file?: string; action?: string; title?: string; code?: string }[];
  fix_notes?: { rounds?: { fixed_blocks?: { part_number?: number; file?: string; code?: string; title?: string; action?: string }[] }[] } | null;
}

const SETUP_FILLED = /(^|\/)(readme(\.md|\.txt)?|requirements[\w-]*\.txt|package\.json)$/i;

function looksLikeFile(path: string): boolean {
  const name = path.split("/").at(-1) ?? "";
  return /^[\w.@+-]+$/.test(name) && (/\.[\w]+$/.test(name) || /^(Dockerfile|Makefile|Procfile|LICENSE)$/i.test(name));
}

/** Setup content: README and dependencies keep their text; notebooks start empty but valid; others start blank. */
export function starterContent(path: string, content: string): string {
  if (SETUP_FILLED.test(path)) return content;
  if (/\.ipynb$/i.test(path)) return JSON.stringify(buildNotebook([]), null, 2);
  return "";
}

export function workspacePath(raw: string): string {
  const path = (/\.ipynb\b/i.test(raw) ? notebookPath(raw) : raw).trim().replace(/^\.\//, "").replace(/\/$/, "");
  if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").some((p) => !p || p === ".." || p === ".")) {
    throw new Error("Invalid workspace file path.");
  }
  if (path.length > 500) throw new Error("Workspace file path is too long.");
  return path;
}

export function isTerminalBlock(block: { file?: string; action?: string }): boolean {
  return block.action === "run" || /^(terminal|shell|bash|commands?|powershell)(\b|$)/i.test(block.file?.trim() ?? "");
}

export function structurePaths(tree: string): string[] {
  const result: string[] = [];
  const stack: string[] = [];
  for (const raw of tree.split("\n")) {
    const branch = raw.match(/^([\s│|]*)(?:[├└]─+|[+`\\]--)[ \t]*(.+)$/);
    const plain = raw.trim();
    if (!plain || plain.startsWith("```") || /^[│|]+$/.test(plain)) continue;
    const name = (branch?.[2] ?? plain).replace(/\s+(?:#|\().*$/, "").trim();
    if (!name || name.startsWith("(")) continue;
    if (!branch && !name.endsWith("/")) continue;
    const depth = branch ? Math.floor((branch[1] ?? "").length / 4) + 1 : 0;
    stack.length = depth;
    stack[depth] = name.replace(/\/$/, "");
    result.push(stack.filter(Boolean).join("/") + (name.endsWith("/") ? "/" : ""));
  }
  // ASCII trees often omit the slash on nonempty folders.
  return result.map((p) => result.some((q) => q.startsWith(p.replace(/\/$/, "") + "/")) ? p.replace(/\/$/, "") + "/" : p);
}

/** Use the same project-root normalization for saved files and editor requests. */
export function workspaceFilePath(raw: string, sections: WorkspaceSection[]): string {
  const trees = sections.flatMap((s) => structurePaths(s.structure ?? ""));
  const root = trees[0]?.endsWith("/") ? trees[0].replace(/\/$/, "") : null;
  const path = workspacePath(raw);
  return root && path.startsWith(root + "/") ? path.slice(root.length + 1) : path;
}

/** One shared source for the saved workspace and the implementation editor. */
export function collectWorkspace(sections: WorkspaceSection[]): WorkspaceEntry[] {
  const entries = new Map<string, WorkspaceEntry>();
  const notebooks = new Map<string, Map<number, { title: string; code: string }>>();
  const trees = sections.flatMap((s) => structurePaths(s.structure ?? ""));
  const root = trees[0]?.endsWith("/") ? trees[0].replace(/\/$/, "") : null;
  const normalize = (raw: string) => workspaceFilePath(raw, sections);
  const put = (raw: string, type: WorkspaceEntry["type"], content = "") => {
    const path = normalize(raw);
    if (path === root && type === "directory") return;
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) {
      const parent = parts.slice(0, i).join("/");
      entries.set(parent, { path: parent, name: parts[i - 1] ?? parent, type: "directory", content: "" });
    }
    const existing = entries.get(path);
    entries.set(path, { path, name: parts.at(-1) ?? path, type, content: content || existing?.content || "" });
  };
  for (const path of trees) {
    // Every folder and file in the plan exists up front; labels are stripped by structurePaths.
    if (path.endsWith("/")) put(path, "directory");
    else if (looksLikeFile(path)) put(path, "file", starterContent(path, ""));
  }
  for (const section of [...sections].sort((a, b) => a.position - b.position)) {
    const complete = new Set<string>();
    for (const f of section.files ?? []) {
      // The setup step only fills README and dependency files; steps fill the rest.
      const content = section.structure ? starterContent(f.path, f.content) : f.content;
      put(f.path, "file", content);
      if (section.structure && !content.trim()) continue;
      if (content.trim()) complete.add(normalize(f.path));
    }
    const blocks = [...(section.blocks ?? [])];
    for (const round of section.fix_notes?.rounds ?? []) {
      for (const fixed of round.fixed_blocks ?? []) {
        const index = (fixed.part_number ?? 0) - 1;
        if (index >= 0 && index < blocks.length) {
          blocks[index] = { ...blocks[index], ...fixed };
          const file = blocks[index]?.file;
          if (file) complete.delete(normalize(file));
        }
      }
    }
    const pieces = new Map<string, string[]>();
    for (const block of blocks) {
      if (!block.file || !block.code?.trim() || isTerminalBlock(block)) continue;
      const path = normalize(block.file);
      if (complete.has(path)) continue;
      if (path.endsWith(".ipynb")) {
        const cells = notebooks.get(path) ?? new Map();
        cells.set(notebookCellIndex(block.file) ?? cells.size + 1, { title: block.title ?? "", code: block.code });
        notebooks.set(path, cells);
      } else {
        const list = pieces.get(path) ?? [];
        if (!list.includes(block.code)) list.push(block.code);
        pieces.set(path, list);
      }
    }
    for (const [path, parts] of pieces) {
      const content = parts.join("\n\n");
      const prior = entries.get(path)?.content;
      // Legacy dependency blocks are append-only; new files[] contain full files.
      put(path, "file", path.endsWith("requirements.txt") && prior ? [...new Set([...prior.split("\n"), ...content.split("\n")])].join("\n") : content);
    }
    for (const [path, cells] of notebooks) {
      if (!complete.has(path)) put(path, "file", JSON.stringify(buildNotebook([...cells.entries()].sort(([a], [b]) => a - b).map(([, c]) => c)), null, 2));
    }
  }
  return [...entries.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export interface WorkspaceTreeNode extends WorkspaceEntry { children: WorkspaceTreeNode[] }
export function workspaceTree(entries: WorkspaceEntry[]): WorkspaceTreeNode[] {
  const nodes = new Map(entries.map((e) => [e.path, { ...e, children: [] as WorkspaceTreeNode[] }]));
  const roots: WorkspaceTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node.path.split("/").slice(0, -1).join("/"));
    if (parent) parent.children.push(node); else roots.push(node);
  }
  const sort = (children: WorkspaceTreeNode[]): WorkspaceTreeNode[] => children.sort((a, b) => Number(b.type === "directory") - Number(a.type === "directory") || a.name.localeCompare(b.name)).map((n) => ({ ...n, children: sort(n.children) }));
  return sort(roots);
}

export function fileLanguage(path: string): string {
  const ext = path.split(".").at(-1)?.toLowerCase() ?? "";
  return ({ py: "python", ipynb: "python", json: "json", ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", md: "markdown", html: "html", css: "css", sql: "sql", yml: "yaml", yaml: "yaml", sh: "shell" } as Record<string, string>)[ext] ?? "plaintext";
}
/** Show a notebook as plain Python: each cell starts with a `# %%` marker, markdown cells become comments. */
export function notebookToPython(json: string): string {
  try {
    const nb = JSON.parse(json) as { cells?: { cell_type?: string; source?: string | string[] }[] };
    if (!Array.isArray(nb.cells)) return json;
    return nb.cells.map((cell) => {
      const src = Array.isArray(cell.source) ? cell.source.join("") : cell.source ?? "";
      if (cell.cell_type === "markdown") return `# %% [markdown]\n${src.split("\n").map((l) => `# ${l}`.trimEnd()).join("\n")}`;
      return `# %%\n${src}`;
    }).join("\n\n");
  } catch {
    return json;
  }
}

/** Turn edited `# %%` Python back into notebook JSON, keeping the original notebook's metadata. */
export function pythonToNotebook(python: string, original: string): string {
  let base: Record<string, unknown> = { metadata: {}, nbformat: 4, nbformat_minor: 5 };
  try { base = JSON.parse(original); } catch { /* use default */ }
  const cells = python.split(/^# %%/m).filter((c, i) => i > 0 || c.trim()).map((chunk) => {
    const markdown = chunk.startsWith(" [markdown]");
    const body = chunk.replace(/^[^\n]*\n?/, "").replace(/\n+$/, "");
    const text = markdown ? body.split("\n").map((l) => l.replace(/^# ?/, "")).join("\n") : body;
    const source = text.split("\n").map((l, i, a) => (i < a.length - 1 ? `${l}\n` : l));
    return markdown
      ? { cell_type: "markdown", metadata: {}, source }
      : { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source };
  });
  return JSON.stringify({ ...base, cells }, null, 1);
}
