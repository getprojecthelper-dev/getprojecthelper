import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import { fileLanguage } from "@/lib/project-workspace";

// Bundled locally: editor loading never depends on a third-party CDN.
globalThis.MonacoEnvironment = { getWorker: (_id, label) => {
  if (label === "json") return new JsonWorker();
  if (label === "typescript" || label === "javascript") return new TsWorker();
  if (["css", "scss", "less"].includes(label)) return new CssWorker();
  if (["html", "handlebars", "razor"].includes(label)) return new HtmlWorker();
  return new EditorWorker();
} };
loader.config({ monaco });

export default function WorkspaceMonaco({ path, content, onChange, readOnly }: { path: string; content: string; onChange: (value: string) => void; readOnly: boolean }) {
  return <Editor path={path} language={fileLanguage(path)} value={content} onChange={(value) => onChange(value ?? "")} theme="vs-dark" loading={<span className="text-sm text-muted-foreground">Opening editor…</span>} options={{ readOnly, automaticLayout: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, wordWrap: "on", tabSize: 4, padding: { top: 12 }, ariaLabel: "Project file contents", fixedOverflowWidgets: true }} />;
}