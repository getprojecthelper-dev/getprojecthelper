import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { asDataset, datasetFacts } from "./dataset";

describe("dataset selection", () => {
  test("reads the dataset a student picked", () => {
    assert.deepEqual(
      asDataset({
        name: "Iris Flowers",
        source: "UCI ML Repository",
        format: "CSV",
        size: "150 rows",
        url: "https://example.com/iris",
      }),
      {
        name: "Iris Flowers",
        source: "UCI ML Repository",
        format: "CSV",
        size: "150 rows",
        url: "https://example.com/iris",
      },
    );
  });

  test("returns null when no dataset was selected", () => {
    assert.equal(asDataset(null), null);
    assert.equal(asDataset(undefined), null);
    assert.equal(asDataset("Iris"), null);
    assert.equal(asDataset([]), null);
    assert.equal(asDataset({ source: "UCI" }), null);
    assert.equal(asDataset({ name: "   " }), null);
  });

  test("blanks out missing fields instead of leaving undefined", () => {
    assert.deepEqual(asDataset({ name: "Iris" }), {
      name: "Iris",
      source: "",
      format: "",
      size: "",
      url: "",
    });
  });

  test("joins only the facts that exist", () => {
    assert.equal(
      datasetFacts(asDataset({ name: "Iris", source: "UCI", format: "CSV", size: "150 rows" })!),
      "UCI · CSV · 150 rows",
    );
    assert.equal(datasetFacts(asDataset({ name: "Iris", format: "CSV" })!), "CSV");
    assert.equal(datasetFacts(asDataset({ name: "Iris" })!), "");
  });
});
