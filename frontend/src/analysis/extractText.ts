import { getDocument, GlobalWorkerOptions, type PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { createWorker, type Worker } from "tesseract.js";

import { AnalysisError, assertPageCount } from "./limits";

GlobalWorkerOptions.workerSrc = workerUrl;

const standardFontDataUrl = `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`;

let ocrWorker: Promise<Worker> | null = null;

function getOcrWorker(): Promise<Worker> {
  if (!ocrWorker) {
    ocrWorker = createWorker("eng").catch((error: unknown) => {
      ocrWorker = null;
      const message = error instanceof Error ? error.message : "OCR failed to start";
      throw new AnalysisError(`Could not start text recognition. ${message}`);
    });
  }
  return ocrWorker;
}

function readableLength(text: string): number {
  return (text.match(/[A-Za-z0-9]/g) ?? []).length;
}

function textFromItems(items: unknown[]): string {
  return items
    .map((item) => {
      if (typeof item === "object" && item && "str" in item && typeof item.str === "string") {
        return item.str;
      }
      return "";
    })
    .join(" ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

async function recognize(image: File | HTMLCanvasElement): Promise<string> {
  const worker = await getOcrWorker();
  try {
    const result = await worker.recognize(image);
    return result.data.text.trim();
  } catch {
    throw new AnalysisError("Could not read this image. Try a PNG or JPG.");
  }
}

async function ocrPdfPage(page: PDFPageProxy): Promise<string> {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new AnalysisError("Could not read a page of this PDF.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, viewport }).promise;
  return recognize(canvas);
}

export async function extractPdfText(
  file: File,
  onPage: (page: number, pageCount: number) => void | Promise<void>,
): Promise<{ text: string; pageCount: number }> {
  let pdf;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    pdf = await getDocument({ data, standardFontDataUrl }).promise;
  } catch {
    throw new AnalysisError("Could not read this PDF.");
  }

  assertPageCount(pdf.numPages);
  const parts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    await onPage(pageNumber, pdf.numPages);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = textFromItems(content.items);
    parts.push(readableLength(text) >= 20 ? text : await ocrPdfPage(page));
  }
  return { text: parts.filter(Boolean).join("\n\n").trim(), pageCount: pdf.numPages };
}

export async function extractImageText(
  file: File,
  onPage: (page: number, pageCount: number) => void | Promise<void>,
): Promise<{ text: string; pageCount: number }> {
  await onPage(1, 1);
  const text = await recognize(file);
  return { text, pageCount: 1 };
}
