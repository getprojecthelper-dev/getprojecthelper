import { ChevronDown, Code2, FileCode, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { cn } from "@/lib/utils";

export type EditorFile = { path: string; code: string };

/**
 * Right-hand editor on the Implementation Steps page. Shows the files of the
 * step the student picked; files from a fresh "Generate" are typed in live.
 */
export function LiveCodeEditor({
  title,
  files,
  activePath,
  onSelect,
  language,
  generating,
  typeToken,
  treePaths,
  codeFor,
}: {
  title: string | null;
  files: EditorFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  language?: string | undefined;
  generating: boolean;
  /** Changes after each fresh generation; files not yet shown for it get typed in. */
  typeToken: number;
  /** Paths from a "create project files" step: shown as a VS Code-style explorer. */
  treePaths?: string[] | undefined;
  codeFor?: ((path: string) => string) | undefined;
}) {
  if (treePaths?.length) {
    return <FileExplorer title={title} paths={treePaths} typeToken={typeToken} codeFor={codeFor} language={language} />;
  }
  return (
    <CodeView
      title={title}
      files={files}
      activePath={activePath}
      onSelect={onSelect}
      language={language}
      generating={generating}
      typeToken={typeToken}
    />
  );
}

function CodeView({
  title,
  files,
  activePath,
  onSelect,
  language,
  generating,
  typeToken,
}: {
  title: string | null;
  files: EditorFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  language?: string | undefined;
  generating: boolean;
  typeToken: number;
}) {
  const active = files.find((f) => f.path === activePath) ?? files[0] ?? null;
  const code = active?.code ?? "";

  // remember which files were already typed for the current token
  const typed = useRef<{ token: number; paths: Set<string> }>({ token: 0, paths: new Set() });
  const [shown, setShown] = useState(code.length);

  useEffect(() => {
    if (!active) return;
    if (typed.current.token !== typeToken) typed.current = { token: typeToken, paths: new Set() };
    const shouldType = typeToken > 0 && !typed.current.paths.has(active.path);
    typed.current.paths.add(active.path);
    if (!shouldType) {
      setShown(code.length);
      return;
    }
    // about 4 seconds max, whatever the file length
    const step = Math.max(8, Math.ceil(code.length / 160));
    let n = 0;
    setShown(0);
    const id = window.setInterval(() => {
      n += step;
      setShown(Math.min(n, code.length));
      if (n >= code.length) window.clearInterval(id);
    }, 25);
    return () => window.clearInterval(id);
  }, [active?.path, code, typeToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const typing = shown < code.length;

  return (
    <div className="panel flex h-full min-h-[28rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Code2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 truncate font-display text-sm">
          {title ? `Code editor — ${title}` : "Code editor"}
        </p>
        {generating || typing ? (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {generating ? "Writing code…" : "Typing…"}
          </span>
        ) : null}
      </div>

      {files.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 py-1.5">
          {files.map((f) => (
            <button
              key={f.path}
              type="button"
              onClick={() => onSelect(f.path)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
                f.path === active?.path
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FileCode className="h-3.5 w-3.5" />
              {f.path.split("/").pop()}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex-1 overflow-auto p-3">
        {active ? (
          <CodeBlock
            code={code.slice(0, shown) || " "}
            language={language}
            filename={active.path}
            className="[&>div:last-child]:max-h-[calc(100vh-14rem)]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Writing the code for this step…
              </>
            ) : (
              <>
                <Code2 className="h-6 w-6" />
                Press Generate on a step, or open a file, to see its code here.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type Row = { name: string; depth: number; folder: boolean; key: string };

// turn ["src/app.py", "data/raw/"] into sorted explorer rows, folders first
function toRows(paths: string[]): Row[] {
  type Node = { children: Map<string, Node>; folder: boolean };
  const root: Node = { children: new Map(), folder: true };
  for (const raw of paths) {
    const clean = raw.replace(/^\.?\//, "");
    const parts = clean.split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const folder = i < parts.length - 1 || clean.endsWith("/");
      let next = node.children.get(part);
      if (!next) {
        next = { children: new Map(), folder };
        node.children.set(part, next);
      } else if (folder) next.folder = true;
      node = next;
    });
  }
  const rows: Row[] = [];
  const walk = (node: Node, depth: number, prefix: string) => {
    [...node.children.entries()]
      .sort(([a, x], [b, y]) => Number(y.folder) - Number(x.folder) || a.localeCompare(b))
      .forEach(([name, child]) => {
        const key = prefix ? `${prefix}/${name}` : name;
        rows.push({ name, depth, folder: child.folder, key });
        walk(child, depth + 1, key);
      });
  };
  walk(root, 0, "");
  return rows;
}

function FileExplorer({
  title,
  paths,
  typeToken,
  codeFor,
  language,
}: {
  title: string | null;
  paths: string[];
  typeToken: number;
  codeFor?: ((path: string) => string) | undefined;
  language?: string | undefined;
}) {
  const rows = toRows(paths);
  const [shown, setShown] = useState(rows.length);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const lastToken = useRef(0);

  useEffect(() => {
    if (typeToken === 0 || lastToken.current === typeToken) {
      setShown(rows.length);
      return;
    }
    lastToken.current = typeToken;
    // add one file/folder at a time, like they are being created
    let n = 0;
    setShown(0);
    const id = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= rows.length) window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
  }, [typeToken, rows.length]);

  // hide rows inside a collapsed folder
  const visible = rows
    .slice(0, shown)
    .filter((r) => ![...closed].some((c) => r.key.startsWith(`${c}/`)));

  const toggle = (key: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selectedCode = selected ? (codeFor?.(selected) ?? "") : "";

  return (
    <div className="panel flex h-full min-h-[28rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Code2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 truncate font-display text-sm">Code editor{title ? ` — ${title}` : ""}</p>
        {shown < rows.length ? (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating files…
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-auto border-r border-border py-2 text-[13px]">
          <p className="px-3 pb-2 text-xs font-semibold text-foreground">Files</p>
          {visible.map((row) => {
            const isOpen = !closed.has(row.key);
            return (
              <button
                key={row.key}
                type="button"
                onClick={() => (row.folder ? toggle(row.key) : setSelected(row.key))}
                className={cn(
                  "flex w-full items-center gap-1.5 py-1 pr-3 text-left animate-in fade-in slide-in-from-left-1 hover:bg-muted/60",
                  selected === row.key && "bg-primary/15 text-primary",
                )}
                style={{ paddingLeft: 10 + row.depth * 14 }}
              >
                {row.folder ? (
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !isOpen && "-rotate-90")}
                  />
                ) : (
                  <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{row.name}</span>
              </button>
            );
          })}
        </div>
        <div className="min-w-0 flex-1 overflow-auto p-3">
          {selected ? (
            selectedCode.trim() ? (
              <CodeBlock code={selectedCode} language={language} filename={selected} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <FileCode className="h-6 w-6" />
                <p className="font-mono text-foreground">{selected}</p>
                This file is empty for now. Its code is added in a later step.
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Click a file to open it.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Parse an ASCII tree ("├── src/", "│   └── app.py") into relative paths. */
export function pathsFromTree(tree: string): string[] {
  const out: string[] = [];
  const stack: string[] = [];
  for (const raw of tree.split("\n")) {
    const m = raw.match(/^([\s│|]*)(?:[├└`]──|[├└]─|[+\\|]--)?\s*(.+?)\s*(?:#.*)?$/);
    if (!m || !m[2]) continue;
    const name = m[2].trim();
    if (!name || /^[│|]+$/.test(name)) continue;
    const depth = Math.round(m[1]!.replace(/│|\|/g, " ").length / 4) + (/[├└`+\\]/.test(raw) ? 1 : 0);
    stack.length = depth;
    stack[depth] = name.replace(/\/$/, "");
    const path = stack.filter(Boolean).join("/") + (name.endsWith("/") ? "/" : "");
    out.push(path);
  }
  // a single top-level folder line (the project name) wraps everything
  return out;
}
