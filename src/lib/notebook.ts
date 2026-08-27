/**
 * Jupyter notebook helpers.
 *
 * Data projects live in notebooks: the exploration, the charts and the model
 * all happen there. When a step's code targets a `.ipynb` file we build a real
 * notebook the student can open in Jupyter / VS Code / Colab straight away,
 * with one cell per part and a short markdown title above each cell.
 */

export interface NotebookCell {
  title: string;
  code: string;
}

/** True when a block's `file` points at a notebook. */
export function isNotebookFile(file?: string | null): boolean {
  return /\.ipynb\b/i.test(file ?? "");
}

/** "notebooks/01_explore.ipynb — cell: 2" -> "notebooks/01_explore.ipynb" */
export function notebookPath(file: string): string {
  const match = file.match(/[\w./\- ]+\.ipynb/i);
  return (match?.[0] ?? file).trim();
}

/** "notebooks/01_explore.ipynb — cell: 2" -> 2 (null when the cell isn't tagged). */
export function notebookCellIndex(file?: string | null): number | null {
  const match = (file ?? "").match(/cell\s*[:#-]?\s*(\d+)/i);
  return match?.[1] ? Number(match[1]) : null;
}

export function notebookName(file: string): string {
  const path = notebookPath(file);
  return path.split("/").pop() ?? path;
}

function toLines(text: string): string[] {
  const lines = text.replace(/\r/g, "").replace(/\n$/, "").split("\n");
  return lines.map((line, i) => (i === lines.length - 1 ? line : `${line}\n`));
}

/** Builds a valid .ipynb document (nbformat 4.5) from ordered cells. */
export function buildNotebook(cells: NotebookCell[], language = "python") {
  return {
    cells: cells.flatMap((cell) => [
      {
        cell_type: "markdown",
        metadata: {},
        source: toLines(`## ${cell.title}`),
      },
      {
        cell_type: "code",
        execution_count: null,
        metadata: {},
        outputs: [],
        source: toLines(cell.code),
      },
    ]),
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language,
        name: "python3",
      },
      language_info: { name: language },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

export function downloadNotebook(fileName: string, cells: NotebookCell[], language = "python") {
  const blob = new Blob([JSON.stringify(buildNotebook(cells, language), null, 1)], {
    type: "application/x-ipynb+json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".ipynb") ? fileName : `${fileName}.ipynb`;
  link.click();
  URL.revokeObjectURL(url);
}
