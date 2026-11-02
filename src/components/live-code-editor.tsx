import { ChevronDown, Code2, FileCode, Folder, FolderOpen, Loader2, X } from "lucide-react";
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

// small colour hint per file type, like VS Code icons
function fileTone(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["py", "ipynb"].includes(ext)) return "text-primary";
  if (["ts", "tsx", "js", "jsx", "json"].includes(ext)) return "text-accent-foreground";
  if (["md", "txt"].includes(ext)) return "text-muted-foreground";
  return "text-muted-foreground";
}

function FileExplorer({
  title,
  paths,
  typeToken,
  codeFor,
}: {
  title: string | null;
  paths: string[];
  typeToken: number;
  codeFor?: ((path: string) => string) | undefined;
  language?: string | undefined;
}) {
  const rows = toRows(paths);
  const firstFile = rows.find((r) => !r.folder)?.key ?? null;
  const [shown, setShown] = useState(rows.length);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [tabs, setTabs] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const lastToken = useRef(0);

  // open the first file by default so the editor is never blank
  const pathsKey = paths.join("|");
  useEffect(() => {
    setSelected(firstFile);
    setTabs(firstFile ? [firstFile] : []);
    setClosed(new Set());
  }, [pathsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const open = (key: string) => {
    setSelected(key);
    setTabs((t) => (t.includes(key) ? t : [...t, key]));
  };
  const closeTab = (key: string) => {
    const rest = tabs.filter((t) => t !== key);
    setTabs(rest);
    if (selected === key) setSelected(rest[rest.length - 1] ?? null);
  };

  const lines = selected ? (codeFor?.(selected) ?? "").replace(/\s+$/, "").split("\n") : [];
  const empty = lines.length === 1 && !lines[0];

  return (
    <div className="panel flex h-full min-h-[28rem] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <Code2 className="h-4 w-4 text-primary" />
        <p className="min-w-0 flex-1 truncate font-display text-sm">Code editor{title ? ` — ${title}` : ""}</p>
        {shown < rows.length ? (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating files…
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1">
        {/* explorer */}
        <div className="w-52 shrink-0 overflow-auto border-r border-border bg-muted/30 py-2 text-[13px]">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
          </p>
          {visible.map((row) => {
            const isOpen = !closed.has(row.key);
            return (
              <button
                key={row.key}
                type="button"
                title={row.key}
                onClick={() => (row.folder ? toggle(row.key) : open(row.key))}
                className={cn(
                  "flex w-full items-center gap-1.5 py-[3px] pr-3 text-left animate-in fade-in slide-in-from-left-1 hover:bg-muted",
                  selected === row.key && "bg-primary/15 text-foreground",
                )}
                style={{ paddingLeft: 8 + row.depth * 12 }}
              >
                {row.folder ? (
                  <>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !isOpen && "-rotate-90")}
                    />
                    {isOpen ? (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
                    )}
                  </>
                ) : (
                  <FileCode className={cn("ml-5 h-3.5 w-3.5 shrink-0", fileTone(row.name))} />
                )}
                <span className="truncate">{row.name}</span>
              </button>
            );
          })}
        </div>

        {/* editor */}
        <div className="flex min-w-0 flex-1 flex-col">
          {tabs.length ? (
            <div className="flex overflow-x-auto border-b border-border bg-muted/30">
              {tabs.map((t) => (
                <div
                  key={t}
                  className={cn(
                    "group flex shrink-0 items-center gap-1.5 border-r border-border px-3 py-1.5 font-mono text-xs",
                    t === selected ? "bg-card text-foreground" : "text-muted-foreground",
                  )}
                >
                  <button type="button" onClick={() => setSelected(t)} className="flex items-center gap-1.5">
                    <FileCode className={cn("h-3.5 w-3.5", fileTone(t))} />
                    {t.split("/").pop()}
                  </button>
                  <button
                    type="button"
                    aria-label={`Close ${t}`}
                    onClick={() => closeTab(t)}
                    className="rounded opacity-60 hover:bg-muted hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {selected ? (
            <p className="border-b border-border px-3 py-1 font-mono text-[11px] text-muted-foreground">
              {selected.split("/").join(" › ")}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 overflow-auto bg-card">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Click a file to open it.
              </div>
            ) : empty ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
                <FileCode className="h-6 w-6" />
                This file is empty for now. Its code is added in a later step.
              </div>
            ) : (
              <table className="w-full border-collapse font-mono text-[12.5px] leading-5">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="w-10 select-none pr-3 text-right align-top text-muted-foreground/60">{i + 1}</td>
                      <td className="whitespace-pre pr-4 text-foreground">{line || " "}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
  // a single top-level folder line (the project name) wraps everything: drop it
  const root = out[0]?.endsWith("/") ? out[0] : null;
  if (root && out.length > 1 && out.slice(1).every((p) => p.startsWith(root))) {
    return out.slice(1).map((p) => p.slice(root.length));
  }
  return out;
}
