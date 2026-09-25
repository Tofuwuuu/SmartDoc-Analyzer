import { readFileSync } from "node:fs";

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import cases from "./compliance.expected.json";
import { isLikelyContract, scanContract } from "./compliance";

GlobalWorkerOptions.workerSrc = new URL(
  "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

async function extractSamplePdf(): Promise<string> {
  const data = new Uint8Array(readFileSync(new URL("../../public/samples/service-agreement.pdf", import.meta.url)));
  const pdf = await getDocument({
    data,
    standardFontDataUrl: new URL("../../node_modules/pdfjs-dist/standard_fonts/", import.meta.url).href,
  }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
      .join("\n");
    pages.push(text);
  }
  return pages.join("\n").trim();
}

describe("bundled sample PDF", () => {
  it("is two pages and raises the same contract flags as the source text", async () => {
    const source = (cases as { name: string; flags: { type: string; severity: string; title: string; description: string }[] }[]).find(
      (item) => item.name === "sample_contract",
    );
    expect(source).toBeTruthy();
    const extracted = await extractSamplePdf();
    expect(isLikelyContract(extracted)).toBe(true);
    const found = scanContract(extracted).map(({ type, severity, title, description }) => ({
      type,
      severity,
      title,
      description,
    }));
    const expected = source?.flags.map(({ type, severity, title, description }) => ({
      type,
      severity,
      title,
      description,
    }));
    expect(found).toEqual(expected);
  });
});
