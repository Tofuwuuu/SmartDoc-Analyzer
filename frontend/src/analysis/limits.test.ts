import { describe, expect, it } from "vitest";

import cases from "./compliance.expected.json";
import { AnalysisError, assertPageCount, assertSupportedFile, MAX_FILE_BYTES, MAX_PAGES } from "./limits";
import { analyzeText } from "./nlp";

function file(name: string, size: number): File {
  const bytes = new Uint8Array(Math.min(size, 8));
  const blob = new File([bytes], name, { type: "application/pdf" });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
}

describe("client limits", () => {
  it("accepts a pdf at 5 MB", () => {
    expect(assertSupportedFile(file("contract.pdf", MAX_FILE_BYTES))).toBe("pdf");
  });

  it("rejects a file over 5 MB", () => {
    expect(() => assertSupportedFile(file("big.pdf", MAX_FILE_BYTES + 1))).toThrow(AnalysisError);
    expect(() => assertSupportedFile(file("big.pdf", MAX_FILE_BYTES + 1))).toThrow(/limit is 5 MB/);
  });

  it("rejects an unsupported type", () => {
    expect(() => assertSupportedFile(file("notes.docx", 100))).toThrow(/PDF or an image/);
  });

  it("rejects more than 10 pages", () => {
    expect(() => assertPageCount(MAX_PAGES)).not.toThrow();
    expect(() => assertPageCount(MAX_PAGES + 1)).toThrow(/limit is 10 pages/);
  });
});

describe("in-browser entity extraction", () => {
  it("finds the people named in the sample contract", () => {
    const sample = (cases as { name: string; text: string }[]).find((item) => item.name === "sample_contract");
    expect(sample).toBeTruthy();
    const analysis = analyzeText(sample?.text ?? "");
    const people = analysis.entities.filter((entity) => entity.label === "PERSON").map((entity) => entity.text);
    expect(people).toContain("Ada Lovelace");
    expect(people).toContain("Samir Patel");
    expect(analysis.stats.top_keywords.length).toBeGreaterThan(0);
    expect(analysis.summary).toMatch(/words across/);
  });
});
