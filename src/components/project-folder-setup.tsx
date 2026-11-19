import { Code2, Download, FolderTree } from "lucide-react";

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
export function ProjectFolderSetup() {
  return (
    <section className="project-folder-setup rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="font-display text-base font-semibold">Set up your project folder</p>
        <p className="mt-1 text-sm text-muted-foreground">No terminal commands are needed.</p>
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="flex gap-3 rounded-lg bg-card/80 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon className="h-3.5 w-3.5 text-primary" /> {title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
