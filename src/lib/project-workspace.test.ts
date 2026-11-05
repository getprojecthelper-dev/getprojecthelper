import { describe, expect, it } from "vitest";
import { collectWorkspace, workspaceFilePath, workspacePath, workspaceTree, notebookToPython, pythonToNotebook } from "./project-workspace";

describe("generated workspace", () => {
  it("preserves every file's actual content and empty folders without duplicating the project root", () => {
    const entries = collectWorkspace([{ position: 1, structure: "project/\n├── data/\n│   └── raw/\n├── dashboard/\n│   └── app.py\n└── requirements.txt", files: [{ path: "dashboard/app.py", content: "import streamlit as st\nst.title('Analysis')" }, { path: "requirements.txt", content: "streamlit==1.41.0" }], blocks: [{ file: "terminal", action: "run", code: "mkdir data" }] }]);
    expect(entries.find((e) => e.path === "data/raw")?.type).toBe("directory");
    expect(entries.find((e) => e.path === "dashboard/app.py")?.content).toBe("");
    expect(entries.find((e) => e.path === "requirements.txt")?.content).toBe("streamlit==1.41.0");
  });

  it("setup creates every planned file, with empty notebooks and no code", () => {
    const entries = collectWorkspace([{ position: 1, structure: "proj/\n├── README.md\n├── notebooks/\n│   └── 02_explore_churn.ipynb\n└── src/\n    └── api.py", files: [{ path: "README.md", content: "# Churn" }] }]);
    expect(entries.find((e) => e.path === "README.md")?.content).toBe("# Churn");
    expect(entries.find((e) => e.path === "src/api.py")?.content).toBe("");
    expect(JSON.parse(entries.find((e) => e.path === "notebooks/02_explore_churn.ipynb")!.content).cells).toHaveLength(0);
  });

  it("keeps the old structure checks", () => {
    const entries = collectWorkspace([{ position: 1, structure: "project/\n├── data/\n│   └── raw/\n├── dashboard/\n│   └── app.py\n└── requirements.txt", files: [{ path: "dashboard/app.py", content: "x" }], blocks: [{ file: "terminal", action: "run", code: "mkdir data" }] }]);
    expect(entries.filter((e) => e.path.endsWith("app.py"))).toHaveLength(1);
    expect(entries.some((e) => e.path === "terminal")).toBe(false);
    expect(workspaceTree(entries).find((e) => e.path === "data")?.children[0]?.path).toBe("data/raw");
  });
  it("builds valid notebooks from actual generated cells and applies fixes", () => {
    const entries = collectWorkspace([{ position: 2, blocks: [{ file: "notebooks/01_explore.ipynb — cell: 1", title: "Load", code: "import pandas as pd" }, { file: "notebooks/01_explore.ipynb — cell: 2", title: "Read", code: "df = pd.read_csv('wrong.csv')" }], fix_notes: { rounds: [{ fixed_blocks: [{ part_number: 2, code: "df = pd.read_csv('data/raw/input.csv')" }] }] } }]);
    const notebook = JSON.parse(entries.find((e) => e.path.endsWith(".ipynb"))?.content ?? "{}");
    expect(notebook.nbformat).toBe(4);
    expect(notebook.cells[3].source.join("")).toBe("df = pd.read_csv('data/raw/input.csv')");
  });
  it("uses full updated contents rather than accumulating duplicate fragments", () => {
    const entries = collectWorkspace([{ position: 1, files: [{ path: "app.py", content: "print(1)" }] }, { position: 2, files: [{ path: "app.py", content: "print(2)" }], blocks: [{ file: "app.py", code: "print(2)" }] }]);
    expect(entries[0]?.content).toBe("print(2)");
  });
  it("does not create explanatory tree labels or block group names as files", () => {
    const entries = collectWorkspace([{ position: 1, structure: "project/\n├── data/\n│   └── raw/\n│       └── (download CSV here)\n└── app.py", files: [{ path: "app.py", content: "print('ready')" }], blocks: [{ file: "terminal", action: "run", code: "mkdir data" }] }]);
    expect(entries.map((e) => e.path)).toEqual(["app.py", "data", "data/raw"]);
  });
  it("opens all parts under the one saved file path, including the project root", () => {
    const sections = [{ position: 1, structure: "project/\n└── src/\n    └── app.py", blocks: [{ file: "./project/src/app.py", code: "def main():" }, { file: "project/src/app.py", code: "    print('ready')" }] }];
    const entries = collectWorkspace(sections);
    for (const block of sections[0]?.blocks ?? []) {
      const requested = workspaceFilePath(block.file, sections);
      expect(requested).toBe("src/app.py");
      expect(entries.find((e) => e.path === requested)?.content).toBe("def main():\n\n    print('ready')");
    }
    expect(entries.filter((e) => e.type === "file")).toHaveLength(1);
  });
  it("does not invent workspace files for unnamed code or terminal commands", () => {
    const entries = collectWorkspace([{ position: 1, blocks: [{ title: "Example", code: "print('example')" }, { file: "terminal", code: "pip install pandas" }] }]);
    expect(entries).toEqual([]);
  });
  it("normalizes notebook cell requests to the saved notebook", () => {
    expect(workspaceFilePath("./project/notebooks/demo.ipynb — cell: 2", [{ position: 1, structure: "project/\n└── notebooks/" }])).toBe("notebooks/demo.ipynb");
  });
  it("rejects traversal and absolute paths", () => {
    expect(() => workspacePath("../secret")).toThrow();
    expect(() => workspacePath("/etc/config")).toThrow();
    expect(() => workspacePath("src/../../config")).toThrow();
  });
});

it("notebook shows as Python and round-trips", () => {
  const nb = JSON.stringify({ cells: [{ cell_type: "markdown", source: ["# Title"] }, { cell_type: "code", source: ["import pandas as pd\n", "print(1)"] }], metadata: { k: 1 } });
  const py = notebookToPython(nb);
  expect(py).toBe("# %% [markdown]\n# # Title\n\n# %%\nimport pandas as pd\nprint(1)");
  const back = JSON.parse(pythonToNotebook(py, nb));
  expect(back.metadata).toEqual({ k: 1 });
  expect(back.cells[1].source.join("")).toBe("import pandas as pd\nprint(1)");
  expect(back.cells[0].source.join("")).toBe("# Title");
});

it("notebook keeps text typed before the first cell marker", () => {
  const back = JSON.parse(pythonToNotebook("import pandas", JSON.stringify({ cells: [], metadata: {}, nbformat: 4, nbformat_minor: 5 })));
  expect(back.cells[0].source.join("")).toBe("import pandas");
});
