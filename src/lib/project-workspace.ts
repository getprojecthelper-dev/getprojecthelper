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

/** One shared source for the saved workspace and the implementation editor. */
export function collectWorkspace(sections: WorkspaceSection[]): WorkspaceEntry[] {
  const entries = new Map<string, WorkspaceEntry>();
  const notebooks = new Map<string, Map<number, { title: string; code: string }>>();
  const trees = sections.flatMap((s) => structurePaths(s.structure ?? ""));
  const root = trees[0]?.endsWith("/") ? trees[0].replace(/\/$/, "") : null;
  const normalize = (raw: string) => {
    const p = workspacePath(raw);
    return root && p.startsWith(root + "/") ? p.slice(root.length + 1) : p;
  };
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
    // Diagrams can include explanatory labels; only files[] and blocks create files.
    if (path.endsWith("/")) put(path, "directory");
  }
  for (const section of [...sections].sort((a, b) => a.position - b.position)) {
    const complete = new Set<string>();
    for (const f of section.files ?? []) {
      put(f.path, "file", f.content);
      if (f.content.trim()) complete.add(normalize(f.path));
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
  return ({ py: "python", ipynb: "json", json: "json", ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", md: "markdown", html: "html", css: "css", sql: "sql", yml: "yaml", yaml: "yaml", sh: "shell" } as Record<string, string>)[ext] ?? "plaintext";
}