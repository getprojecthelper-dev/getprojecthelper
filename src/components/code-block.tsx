import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { highlightLine, isPlainLanguage, type TokenKind } from "@/lib/highlight";
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



export function CodeBlock({
  code,
  language,
  filename,
  className,
}: {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
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

  const plain = isPlainLanguage(language, filename);
  const lines = useMemo(
    () => code.replace(/\n$/, "").split("\n").map((line) => highlightLine(line, plain)),
    [code, plain],
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-secondary/60 shadow-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/70 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </span>
          <span className="font-mono">{filename ?? language ?? "code"}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1.5 px-2 text-xs" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="max-h-[26rem] overflow-auto bg-card">
        <table className="w-full border-collapse font-mono text-[12.5px] leading-relaxed">
          <tbody>
            {lines.map((tokens, i) => (
              <tr key={`${i}-${tokens[0]?.text.slice(0, 12) ?? ""}`} className="align-top">
                <td className="w-10 select-none border-r border-border bg-muted/40 px-2 py-0.5 text-right text-[11px] text-muted-foreground">
                  {i + 1}
                </td>
                <td className="whitespace-pre px-3 py-0.5 text-card-foreground">
                  {tokens.length === 0
                    ? " "
                    : tokens.map((token, index) => (
                        <span key={index} className={TOKEN_CLASS[token.kind]}>
                          {token.text}
                        </span>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

}
