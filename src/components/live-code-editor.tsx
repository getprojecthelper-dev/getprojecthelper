import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Code2, FileCode, Folder, FolderOpen, Loader2, Save, Terminal, X } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadProjectWorkspace, saveWorkspaceFile } from "@/lib/project-workspace.functions";
import { workspaceTree, type WorkspaceTreeNode } from "@/lib/project-workspace";
import { cn } from "@/lib/utils";

const Monaco = lazy(() => import("@/components/workspace-monaco"));
export const workspaceKey = (projectId: string) => ["project-workspace", projectId] as const;

export function LiveCodeEditor({ projectId, projectName, activePath, generating, terminal }: {
  projectId: string; projectName: string; activePath: string | null; generating: boolean; terminal: string;
}) {
  const qc = useQueryClient();
  const load = useServerFn(loadProjectWorkspace);
  const save = useServerFn(saveWorkspaceFile);
  const workspace = useQuery({ queryKey: workspaceKey(projectId), queryFn: () => load({ data: { projectId } }) });
  const entries = workspace.data?.entries ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [tabs, setTabs] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [terminalOpen, setTerminalOpen] = useState(true);
  const tree = useMemo(() => workspaceTree(entries.map((e) => ({ ...e, type: e.type === "directory" ? "directory" : "file" }))), [entries]);
  const open = (path: string) => { setSelected(path); setTabs((old) => old.includes(path) ? old : [...old, path]); };
  useEffect(() => {
    const requested = activePath?.replace(/\s*[—–-]\s*cell\s*:\s*\d+.*$/i, "").replace(/^\.\//, "");
    const path = entries.find((e) => e.type === "file" && e.path === requested)?.path;
    if (path) open(path);
    else if (!selected) { const first = entries.find((e) => e.type === "file"); if (first) open(first.path); }
  }, [activePath, entries]);
  const active = entries.find((e) => e.path === selected && e.type === "file");
  const content = active ? drafts[active.path] ?? active.content : "";
  const dirty = active ? content !== active.content : false;
  const mutation = useMutation({
    mutationFn: (vars: { path: string; content: string; revision: number }) => save({ data: { projectId, ...vars } }),
    onSuccess: (saved, vars) => {
      qc.setQueryData(workspaceKey(projectId), (old: typeof workspace.data) => old ? { ...old, entries: old.entries.map((e) => e.path === saved.path ? saved : e) } : old);
      setDrafts((old) => { if (old[vars.path] !== vars.content) return old; const next = { ...old }; delete next[vars.path]; return next; });
      toast.success("File saved.");
    },
    onError: (error) => toast.error(error.message),
  });
  const toggle = (path: string) => setClosed((old) => { const next = new Set(old); if (next.has(path)) next.delete(path); else next.add(path); return next; });
  const closeTab = (path: string) => {
    if (drafts[path] !== undefined && drafts[path] !== entries.find((e) => e.path === path)?.content && !window.confirm("Close this tab and discard unsaved changes?")) return;
    setDrafts((old) => { const next = { ...old }; delete next[path]; return next; });
    const rest = tabs.filter((t) => t !== path); setTabs(rest); if (selected === path) setSelected(rest.at(-1) ?? null);
  };
  useEffect(() => {
    const unsaved = Object.keys(drafts).some((path) => drafts[path] !== entries.find((e) => e.path === path)?.content);
    const warn = (event: BeforeUnloadEvent) => { if (unsaved) event.preventDefault(); };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [drafts, entries]);

  return <section className="flex h-full min-h-[36rem] min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card" aria-label="Project code workspace">
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
      <Code2 className="h-4 w-4 text-primary" /><h2 className="min-w-0 flex-1 truncate text-sm font-semibold">Code editor</h2>
      {generating || workspace.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
      <span className="text-xs text-muted-foreground">{dirty ? "Unsaved" : "Saved"}</span>
      <Button size="icon" variant="ghost" aria-label="Save file" title="Save file" disabled={!dirty || mutation.isPending || !workspace.data?.canEdit} onClick={() => { if (active) mutation.mutate({ path: active.path, content, revision: active.revision }); }}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </Button>
    </header>
    <div className="flex min-h-0 flex-1">
      <nav className="w-36 shrink-0 overflow-auto border-r border-border bg-muted/20 py-2 sm:w-44 xl:w-52" aria-label="Project Explorer">
        <p className="px-3 py-1 text-xs font-semibold text-muted-foreground">EXPLORER</p>
        <p className="truncate px-3 py-2 text-xs font-semibold" title={projectName}>{projectName}</p>
        {tree.map((node) => <TreeNode key={node.path} node={node} closed={closed} selected={selected} open={open} toggle={toggle} />)}
        {workspace.isError ? <div className="px-3 text-xs text-destructive">{workspace.error.message}<Button variant="ghost" size="sm" onClick={() => void workspace.refetch()}>Retry</Button></div> : null}
        {!entries.length && !workspace.isPending ? <p className="px-3 text-xs text-muted-foreground">No generated files yet.</p> : null}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-9 shrink-0 overflow-x-auto border-b border-border bg-muted/20" role="tablist" aria-label="Open files">
          {tabs.map((path) => <div key={path} className={cn("flex shrink-0 items-center border-r border-border", selected === path && "border-t-2 border-t-primary bg-card")}>
            <Button role="tab" aria-selected={selected === path} variant="ghost" size="sm" className="h-8 rounded-none px-2 font-mono text-xs" title={path} onClick={() => open(path)}><FileCode className="h-3.5 w-3.5" />{path.split("/").at(-1)}{drafts[path] !== undefined && drafts[path] !== entries.find((e) => e.path === path)?.content ? " •" : ""}</Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Close ${path}`} onClick={() => closeTab(path)}><X className="h-3 w-3" /></Button>
          </div>)}
        </div>
        <p className="h-7 shrink-0 truncate border-b border-border px-3 py-1 font-mono text-xs text-muted-foreground">{active?.path ?? ""}</p>
        <div className="relative min-h-[20rem] min-w-0 flex-1" data-workspace-active-path={active?.path ?? ""}>
          {active ? <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Opening editor…</div>}><Monaco path={`${projectId}/${active.path}`} content={content} readOnly={!workspace.data?.canEdit} onChange={(value) => setDrafts((old) => ({ ...old, [active.path]: value }))} /></Suspense> : <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">{generating ? "Generating project files…" : "Select a generated file."}</div>}
        </div>
        <div className="shrink-0 border-t border-border">
          <Button variant="ghost" size="sm" className="h-8 rounded-none text-xs" aria-expanded={terminalOpen} onClick={() => setTerminalOpen((v) => !v)}><Terminal className="h-3.5 w-3.5" />Terminal<ChevronDown className={cn("h-3 w-3", !terminalOpen && "-rotate-90")} /></Button>
          {terminalOpen ? <pre aria-label="Generated terminal commands" className="h-28 overflow-auto border-t border-border bg-background/50 p-3 font-mono text-xs text-muted-foreground">{terminal || "No terminal commands for this step."}</pre> : null}
        </div>
      </div>
    </div>
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-primary/10 px-3 text-[11px] text-muted-foreground"><span>{entries.filter((e) => e.type === "file").length} files</span><span>{workspace.data?.canEdit ? "Project workspace" : "Read only"}</span></footer>
  </section>;
}

function TreeNode({ node, closed, selected, open, toggle }: { node: WorkspaceTreeNode; closed: Set<string>; selected: string | null; open: (path: string) => void; toggle: (path: string) => void }) {
  const folder = node.type === "directory";
  const expanded = !closed.has(node.path);
  return <div>
    <Button variant="ghost" size="sm" className={cn("h-7 w-full justify-start gap-1.5 rounded-none px-2 text-xs font-normal", selected === node.path && "bg-primary/15")} title={node.path} aria-label={`${folder ? "Folder" : "File"} ${node.path}`} aria-expanded={folder ? expanded : undefined} onClick={() => folder ? toggle(node.path) : open(node.path)}>
      {folder ? <><ChevronDown className={cn("h-3 w-3 shrink-0", !expanded && "-rotate-90")} />{expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />}</> : <FileCode className="ml-4 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span className="truncate">{node.name}</span>
    </Button>
    {folder && expanded ? <div className="ml-3 border-l border-border/40">{node.children.map((child) => <TreeNode key={child.path} node={child} closed={closed} selected={selected} open={open} toggle={toggle} />)}</div> : null}
  </div>;
}
