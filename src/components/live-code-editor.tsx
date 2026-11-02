import { Code2, FileCode, Loader2 } from "lucide-react";
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
}: {
  title: string | null;
  files: EditorFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  language?: string | undefined;
  generating: boolean;
  /** Changes after each fresh generation; files not yet shown for it get typed in. */
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
