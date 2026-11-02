import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import { fileLanguage } from "@/lib/project-workspace";

// Bundled locally: editor loading never depends on a third-party CDN.
globalThis.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

export default function WorkspaceMonaco({ path, content, onChange, readOnly }: { path: string; content: string; onChange: (value: string) => void; readOnly: boolean }) {
  return <Editor path={path} language={fileLanguage(path)} value={content} onChange={(value) => onChange(value ?? "")} theme="vs-dark" loading={<span className="text-sm text-muted-foreground">Opening editor…</span>} options={{ readOnly, automaticLayout: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, wordWrap: "on", tabSize: 4, padding: { top: 12 }, ariaLabel: "Project file contents", fixedOverflowWidgets: true }} />;
}