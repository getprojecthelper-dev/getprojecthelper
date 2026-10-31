export interface SelectedDataset {
  name: string;
  source: string;
  format: string;
  size: string;
  url: string;
}

/** Reads the dataset a student picked during project setup, or null if none. */
export function asDataset(value: unknown): SelectedDataset | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const name = typeof record["name"] === "string" ? record["name"].trim() : "";
  if (!name) return null;
  return {
    name,
    source: typeof record["source"] === "string" ? record["source"] : "",
    format: typeof record["format"] === "string" ? record["format"] : "",
    size: typeof record["size"] === "string" ? record["size"] : "",
    url: typeof record["url"] === "string" ? record["url"] : "",
  };
}

/** "Source · Format · Size" with only the parts that exist. */
export function datasetFacts(dataset: SelectedDataset): string {
  return [dataset.source, dataset.format, dataset.size].filter(Boolean).join(" · ");
}
