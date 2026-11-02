import { describe, expect, it } from "vitest";
import { collectWorkspace, workspacePath, workspaceTree } from "./project-workspace";

describe("generated workspace", () => {
  it("preserves every file's actual content and empty folders without duplicating the project root", () => {
    const entries = collectWorkspace([{ position: 1, structure: "project/\n├── data/\n│   └── raw/\n├── dashboard/\n│   └── app.py\n└── requirements.txt", files: [{ path: "dashboard/app.py", content: "import streamlit as st\nst.title('Analysis')" }, { path: "requirements.txt", content: "streamlit==1.41.0" }], blocks: [{ file: "terminal", action: "run", code: "mkdir data" }] }]);
    expect(entries.find((e) => e.path === "data/raw")?.type).toBe("directory");
    expect(entries.find((e) => e.path === "dashboard/app.py")?.content).toBe("import streamlit as st\nst.title('Analysis')");
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
  it("rejects traversal and absolute paths", () => {
    expect(() => workspacePath("../secret")).toThrow();
    expect(() => workspacePath("/etc/config")).toThrow();
    expect(() => workspacePath("src/../../config")).toThrow();
  });
});