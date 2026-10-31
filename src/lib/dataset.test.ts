import { describe, expect, it } from "vitest";

import { asDataset, datasetFacts } from "./dataset";

describe("asDataset", () => {
  it("reads the dataset a student picked", () => {
    const dataset = asDataset({
      name: "Iris Flowers",
      source: "UCI ML Repository",
      format: "CSV",
      size: "150 rows",
      url: "https://example.com/iris",
    });
    expect(dataset).toEqual({
      name: "Iris Flowers",
      source: "UCI ML Repository",
      format: "CSV",
      size: "150 rows",
      url: "https://example.com/iris",
    });
  });

  it("returns null when no dataset was selected", () => {
    expect(asDataset(null)).toBeNull();
    expect(asDataset(undefined)).toBeNull();
    expect(asDataset("Iris")).toBeNull();
    expect(asDataset([])).toBeNull();
    expect(asDataset({ source: "UCI" })).toBeNull();
    expect(asDataset({ name: "   " })).toBeNull();
  });

  it("blanks out missing fields instead of leaving undefined", () => {
    expect(asDataset({ name: "Iris" })).toEqual({
      name: "Iris",
      source: "",
      format: "",
      size: "",
      url: "",
    });
  });
});

describe("datasetFacts", () => {
  it("joins only the parts that exist", () => {
    const dataset = asDataset({ name: "Iris", source: "UCI", format: "CSV", size: "150 rows" });
    expect(datasetFacts(dataset!)).toBe("UCI · CSV · 150 rows");
    expect(datasetFacts(asDataset({ name: "Iris", format: "CSV" })!)).toBe("CSV");
    expect(datasetFacts(asDataset({ name: "Iris" })!)).toBe("");
  });
});
