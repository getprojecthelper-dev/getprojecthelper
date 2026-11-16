import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronDown,
  Code2,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  NotebookPen,
  Save,
  Terminal,
  X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadProjectWorkspace, saveWorkspaceFile } from "@/lib/project-workspace.functions";
import { workspaceTree, type WorkspaceTreeNode } from "@/lib/project-workspace";
import { cn } from "@/lib/utils";

const Monaco = lazy(() => import("@/components/workspace-monaco"));
export const workspaceKey = (projectId: string) => ["project-workspace", projectId] as const;

export function LiveCodeEditor({
  projectId,
  projectName,
  activeFile,
  generating,
  terminal,
}: {
  projectId: string;
  projectName: string;
  activeFile: { path: string | null } | null;
  generating: boolean;
  terminal: string;
}) {
  const qc = useQueryClient();
  const load = useServerFn(loadProjectWorkspace);
  const save = useServerFn(saveWorkspaceFile);
  const workspace = useQuery({
    queryKey: workspaceKey(projectId),
    queryFn: () => load({ data: { projectId } }),
  });
  const entries = workspace.data?.entries ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [terminalOpen, setTerminalOpen] = useState(true);
  const tree = useMemo(
    () =>
      workspaceTree(
        entries.map((e) => ({ ...e, type: e.type === "directory" ? "directory" : "file" })),
      ),
    [entries],
  );
  const open = (path: string) => {
    setSelected(path);
    setTabs((old) => (old.includes(path) ? old : [...old, path]));
  };
  useEffect(() => {
    const requested = activeFile?.path;
    const path = entries.find((e) => e.type === "file" && e.path === requested)?.path;
    if (path) open(path);
    else if (!selected) {
      const first = entries.find((e) => e.type === "file");
      if (first) open(first.path);
    }
  }, [activeFile, entries]);
  const active = entries.find((e) => e.path === selected && e.type === "file");
  const content = active ? (drafts[active.path] ?? active.content) : "";
  const dirty = active ? content !== active.content : false;
  const mutation = useMutation({
    mutationFn: (vars: { path: string; content: string; revision: number }) =>
      save({ data: { projectId, ...vars } }),
    onSuccess: (saved, vars) => {
      qc.setQueryData(workspaceKey(projectId), (old: typeof workspace.data) =>
        old
          ? { ...old, entries: old.entries.map((e) => (e.path === saved.path ? saved : e)) }
          : old,
      );
      setDrafts((old) => {
        if (old[vars.path] !== vars.content) return old;
        const next = { ...old };
        delete next[vars.path];
        return next;
      });
      toast.success("File saved.");
    },
    onError: (error) => toast.error(error.message),
  });
  const toggle = (path: string) =>
    setClosed((old) => {
      const next = new Set(old);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  const closeTab = (path: string) => {
    if (
      drafts[path] !== undefined &&
      drafts[path] !== entries.find((e) => e.path === path)?.content &&
      !window.confirm("Close this tab and discard unsaved changes?")
    )
      return;
    setDrafts((old) => {
      const next = { ...old };
      delete next[path];
      return next;
    });
    const rest = tabs.filter((t) => t !== path);
    setTabs(rest);
    if (selected === path) setSelected(rest.at(-1) ?? null);
  };
  useEffect(() => {
    const unsaved = Object.keys(drafts).some(
      (path) => drafts[path] !== entries.find((e) => e.path === path)?.content,
    );
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [drafts, entries]);

  return (
    <section
      className="live-code-editor panel flex h-full min-h-[36rem] min-w-0 flex-col overflow-hidden rounded-2xl border md:min-h-0"
      aria-label="Project code workspace"
    >
      <header className="live-code-editor__header flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <Code2 className="h-4 w-4 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">Code editor</h2>
        {generating || workspace.isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : null}
        <span className="text-xs text-muted-foreground">{dirty ? "Unsaved" : "Saved"}</span>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Save file"
          title="Save file"
          disabled={!dirty || mutation.isPending || !workspace.data?.canEdit}
          onClick={() => {
            if (active) mutation.mutate({ path: active.path, content, revision: active.revision });
          }}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </header>
      <div className="live-code-editor__body flex min-h-0 flex-1">
        <nav
          className="live-code-editor__explorer w-44 shrink-0 overflow-auto border-r py-3 sm:w-48 xl:w-60"
          aria-label="Project Explorer"
        >
          <p className="px-4 py-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground">
            FILES
          </p>
          <p className="truncate px-4 py-2 text-xs font-semibold" title={projectName}>
            {projectName}
          </p>
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              closed={closed}
              selected={selected}
              open={open}
              toggle={toggle}
            />
          ))}
          {workspace.isError ? (
            <div className="px-3 text-xs text-destructive">
              {workspace.error.message}
              <Button variant="ghost" size="sm" onClick={() => void workspace.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}
          {!entries.length && !workspace.isPending ? (
            <p className="px-3 text-xs text-muted-foreground">No generated files yet.</p>
          ) : null}
        </nav>
        <div className="live-code-editor__main flex min-w-0 flex-1 flex-col">
          <div
            className="live-code-editor__tabs flex h-10 shrink-0 overflow-x-auto border-b"
            role="tablist"
            aria-label="Open files"
          >
            {tabs.map((path) => (
              <div
                key={path}
                className={cn(
                  "live-code-editor__tab flex shrink-0 items-center border-r",
                  selected === path && "is-active",
                )}
              >
                <Button
                  role="tab"
                  aria-selected={selected === path}
                  variant="ghost"
                  size="sm"
                  className="h-9 max-w-56 rounded-none px-3 font-mono text-xs"
                  title={path}
                  onClick={() => open(path)}
                >
                  <FileCode className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{path.split("/").at(-1)}</span>
                  {drafts[path] !== undefined &&
                  drafts[path] !== entries.find((e) => e.path === path)?.content
                    ? " •"
                    : ""}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={`Close ${path}`}
                  onClick={() => closeTab(path)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <p className="live-code-editor__path h-8 shrink-0 truncate border-b px-4 py-2 font-mono text-[11px]">
            {active?.path ?? ""}
          </p>
          <div
            className="live-code-editor__code relative min-h-[20rem] min-w-0 flex-1"
            data-workspace-active-path={active?.path ?? ""}
          >
            {active ? (
              <Suspense
                fallback={
                  <div
                    className="live-code-editor__loading flex h-full min-h-56 flex-col items-center justify-center gap-3 text-sm"
                    role="status"
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing your editor…</span>
                  </div>
                }
              >
                <Monaco
                  path={`${projectId}/${active.path}`}
                  content={content}
                  readOnly={!workspace.data?.canEdit}
                  onChange={(value) => setDrafts((old) => ({ ...old, [active.path]: value }))}
                />
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                {generating ? "Generating project files…" : "Select a generated file."}
              </div>
            )}
          </div>
          <div className="live-code-editor__terminal shrink-0 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-none px-4 text-xs"
              aria-expanded={terminalOpen}
              onClick={() => setTerminalOpen((v) => !v)}
            >
              <Terminal className="h-3.5 w-3.5" />
              Terminal
              <ChevronDown className={cn("h-3 w-3", !terminalOpen && "-rotate-90")} />
            </Button>
            {terminalOpen ? (
              <pre
                aria-label="Generated terminal commands"
                className="h-24 overflow-auto border-t p-3 font-mono text-xs"
              >
                {terminal || "No terminal commands for this step."}
              </pre>
            ) : null}
          </div>
        </div>
      </div>
      <footer className="live-code-editor__footer flex h-7 shrink-0 items-center justify-between border-t px-4 text-[11px]">
        <span>{entries.filter((e) => e.type === "file").length} files</span>
        <span>{workspace.data?.canEdit ? "Project workspace" : "Read only"}</span>
      </footer>
    </section>
  );
}

function TreeNode({
  node,
  closed,
  selected,
  open,
  toggle,
}: {
  node: WorkspaceTreeNode;
  closed: Set<string>;
  selected: string | null;
  open: (path: string) => void;
  toggle: (path: string) => void;
}) {
  const folder = node.type === "directory";
  const expanded = !closed.has(node.path);
  const fileVisual = getFileVisual(node.path);
  const FileIcon = fileVisual.icon;
  const [cdnIconFailed, setCdnIconFailed] = useState(false);
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "live-code-editor__tree-button h-8 w-full justify-start gap-1.5 rounded-none px-3 text-xs font-normal",
          selected === node.path && "is-selected",
        )}
        title={node.path}
        aria-label={`${folder ? "Folder" : "File"} ${node.path}`}
        aria-expanded={folder ? expanded : undefined}
        onClick={() => (folder ? toggle(node.path) : open(node.path))}
      >
        {folder ? (
          <>
            <ChevronDown className={cn("h-3 w-3 shrink-0", !expanded && "-rotate-90")} />
            {expanded ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </>
        ) : (
          <span className="ml-4 grid h-4 w-4 shrink-0 place-items-center">
            {cdnIconFailed ? (
              <FileIcon className={cn("h-3.5 w-3.5", fileVisual.className)} />
            ) : (
              <img
                src={fileVisual.cdnSrc}
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                loading="lazy"
                decoding="async"
                className="h-4 w-4 object-contain"
                onError={() => setCdnIconFailed(true)}
              />
            )}
          </span>
        )}
        <span className="truncate">{node.name}</span>
      </Button>
      {folder && expanded ? (
        <div className="ml-3 border-l border-border/40">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              closed={closed}
              selected={selected}
              open={open}
              toggle={toggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getFileVisual(path: string) {
  const extension = path.split(".").at(-1)?.toLowerCase();
  const cdn = (name: string) => `https://api.iconify.design/vscode-icons/${name}.svg?height=18`;
  if (extension === "ipynb")
    return {
      icon: NotebookPen,
      className: "text-[#c87924]",
      cdnSrc: cdn("file-type-jupyter"),
    };
  if (["csv", "tsv", "xlsx", "xls"].includes(extension ?? ""))
    return {
      icon: FileSpreadsheet,
      className: "text-[#23834a]",
      cdnSrc: cdn(extension === "csv" || extension === "tsv" ? "file-type-csv" : "file-type-excel"),
    };
  if (["md", "txt", "rst"].includes(extension ?? ""))
    return {
      icon: FileText,
      className: "text-[#737b87]",
      cdnSrc: cdn(extension === "md" ? "file-type-markdown" : "file-type-text"),
    };
  if (["py", "pyw", "pyi"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#3978c5]", cdnSrc: cdn("file-type-python") };
  if (["js", "jsx", "mjs", "cjs"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#cba42b]", cdnSrc: cdn("file-type-js") };
  if (["ts", "tsx", "mts", "cts"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#3178c6]", cdnSrc: cdn("file-type-typescript") };
  if (["json", "jsonc"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#b78b22]", cdnSrc: cdn("file-type-json") };
  if (["html", "htm"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#e44d26]", cdnSrc: cdn("file-type-html") };
  if (["css", "scss", "sass", "less"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#6c63bd]", cdnSrc: cdn("file-type-css") };
  if (["yml", "yaml"].includes(extension ?? ""))
    return { icon: FileCode, className: "text-[#cb171e]", cdnSrc: cdn("file-type-yaml") };
  if (extension === "sql")
    return { icon: FileCode, className: "text-[#3978c5]", cdnSrc: cdn("file-type-sql") };
  if (extension === "toml")
    return { icon: FileCode, className: "text-[#7a6d5a]", cdnSrc: cdn("file-type-toml") };
  if (extension === "gitignore")
    return { icon: FileCode, className: "text-[#f05032]", cdnSrc: cdn("file-type-git") };
  return { icon: FileCode, className: "text-[#3978c5]", cdnSrc: cdn("default-file") };
}
