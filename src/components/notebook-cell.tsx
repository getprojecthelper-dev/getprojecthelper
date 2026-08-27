import { Check, Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { highlightLine, type TokenKind } from "@/lib/highlight";
import { downloadNotebook } from "@/lib/notebook";
import { cn } from "@/lib/utils";

const TOKEN_CLASS: Record<TokenKind, string> = {
  keyword: "tok-keyword",
  string: "tok-string",
  number: "tok-number",
  comment: "tok-comment",
  function: "tok-function",
  builtin: "tok-builtin",
  variable: "tok-variable",
  property: "tok-property",
  type: "tok-type",
  operator: "tok-operator",
  punct: "tok-punct",
  plain: "",
};

/**
 * A single Jupyter-style notebook cell.
 *
 * Notebook steps should look like a notebook, not a terminal: an `In [ ]:`
 * prompt on the left, one soft cell body on the right.
 */
export function NotebookCell({
  code,
  notebook,
  index,
  className,
}: {
  code: string;
  notebook?: string | undefined;
  index?: number | undefined;
  className?: string | undefined;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const lines = useMemo(
    () => code.replace(/\n$/, "").split("\n").map((line) => highlightLine(line, false)),
    [code],
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-info/30 bg-card shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-info/5 px-3 py-2">
        <p className="truncate font-mono text-xs text-muted-foreground">
          {notebook ? `${notebook} · ` : ""}notebook cell{index ? ` ${index}` : ""}
        </p>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy cell"}
        </Button>
      </div>
      <div className="flex items-stretch">
        <div className="select-none border-r border-border/60 bg-muted/30 px-3 py-3 font-mono text-[11px] text-info">
          In [ ]:
        </div>
        <div className="min-w-0 flex-1 overflow-auto py-2">
          <pre className="whitespace-pre px-3 font-mono text-[12.5px] leading-relaxed text-card-foreground">
            {lines.map((tokens, i) => (
              <div key={i}>
                {tokens.length === 0
                  ? " "
                  : tokens.map((token, ti) => (
                      <span key={ti} className={TOKEN_CLASS[token.kind]}>
                        {token.text}
                      </span>
                    ))}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
