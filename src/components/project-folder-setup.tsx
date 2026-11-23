import {
  Archive,
  ChevronDown,
  Code2,
  Download,
  FolderCode,
  FolderTree,
  Loader2,
} from "lucide-react";
import { useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Download, title: "Download", text: "Save the project folder ZIP to your computer." },
  { icon: Archive, title: "Extract", text: "Right-click the ZIP and choose Extract All." },
  {
    icon: Code2,
    title: "Open",
    text: "Open the extracted folder in VS Code or your preferred editor.",
  },
];

type ProjectFolderSetupProps = {
  structure: string;
  onDownload: () => void;
  downloading: boolean;
};

/** A ZIP-first setup guide; students never need to create folders in a terminal. */
export function ProjectFolderSetup({
  structure,
  onDownload,
  downloading,
}: ProjectFolderSetupProps) {
  const [showStructure, setShowStructure] = useState(false);

  return (
    <section className="project-folder-setup">
      <div className="project-folder-setup__heading">
        <span className="project-folder-setup__heading-icon" aria-hidden="true">
          <FolderCode />
        </span>
        <div>
          <h3>Set up your project folder</h3>
          <p>Get a local copy of the project and open it in your editor.</p>
        </div>
      </div>

      <p className="project-folder-setup__note">No terminal commands are needed.</p>

      <ol className="project-folder-setup__steps">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className="project-folder-setup__step">
            <span className="project-folder-setup__number">{index + 1}</span>
            <span className="project-folder-setup__icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="project-folder-setup__copy">
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
            {index === 0 ? (
              <Button
                type="button"
                size="sm"
                className="project-folder-setup__download"
                onClick={onDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                {downloading ? "Preparing…" : "Download ZIP"}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="project-folder-setup__tree">
        <button
          type="button"
          onClick={() => setShowStructure((shown) => !shown)}
          aria-expanded={showStructure}
        >
          <FolderTree aria-hidden="true" />
          {showStructure ? "Hide" : "View"} project file tree
          <ChevronDown className={showStructure ? "is-open" : ""} aria-hidden="true" />
        </button>
        {showStructure ? <CodeBlock code={structure} filename="project structure" /> : null}
      </div>
    </section>
  );
}
