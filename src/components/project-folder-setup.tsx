import { ChevronDown, Code2, Download, FolderTree } from "lucide-react";
import { useState } from "react";

import { CodeBlock } from "@/components/code-block";

const steps = [
  { icon: Download, title: "Download", text: "Save the project folder ZIP to your computer." },
  { icon: FolderTree, title: "Extract", text: "Right-click the ZIP and choose Extract All." },
  {
    icon: Code2,
    title: "Open",
    text: "Open the extracted folder in VS Code or your preferred editor.",
  },
];

/** The ZIP replaces the old terminal-based folder-creation instructions. */
export function ProjectFolderSetup({ structure }: { structure: string }) {
  const [showStructure, setShowStructure] = useState(false);

  return (
    <section className="project-folder-setup rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="font-display text-base font-semibold">Set up your project folder</p>
        <p className="mt-1 text-sm text-muted-foreground">No terminal commands are needed.</p>
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex items-start gap-3 rounded-lg bg-card/80 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" /> {title}
              </span>
              <span className="text-sm leading-5 text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="mt-3 flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setShowStructure((shown) => !shown)}
        aria-expanded={showStructure}
      >
        {showStructure ? "Hide" : "View"} project file tree
        <ChevronDown className={showStructure ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
      </button>
      {showStructure ? <CodeBlock code={structure} filename="project structure" /> : null}
    </section>
  );
}
