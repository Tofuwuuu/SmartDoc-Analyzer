import { isLikelyContract, scanContract } from "./compliance";
import { extractImageText, extractPdfText } from "./extractText";
import { assertSupportedFile } from "./limits";
import { analyzeText } from "./nlp";
import type { EntityItem, InsightStats, KeywordItem, RiskFlag } from "../types";

export interface AnalysisResult {
  filename: string;
  contentType: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  entities: EntityItem[];
  keywords: KeywordItem[];
  summary: string;
  stats: InsightStats;
  documentType: "contract" | "general";
  riskFlags: RiskFlag[];
}

export type ProgressUpdate =
  | { phase: "read"; page: number; pageCount: number }
  | { phase: "entities"; pageCount: number }
  | { phase: "rules"; pageCount: number };

function pause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 280);
  });
}

export async function analyzeFile(
  file: File,
  onProgress: (update: ProgressUpdate) => void,
): Promise<AnalysisResult> {
  const extension = assertSupportedFile(file);
  const report = async (update: ProgressUpdate) => {
    onProgress(update);
    await pause();
  };

  const extracted =
    extension === "pdf"
      ? await extractPdfText(file, async (page, pageCount) => {
          onProgress({ phase: "read", page, pageCount });
          await pause();
        })
      : await extractImageText(file, async (page, pageCount) => {
          onProgress({ phase: "read", page, pageCount });
          await pause();
        });

  await report({ phase: "entities", pageCount: extracted.pageCount });
  const analysis = analyzeText(extracted.text);
  const contract = isLikelyContract(extracted.text);
  await report({ phase: "rules", pageCount: extracted.pageCount });
  const riskFlags = contract ? scanContract(extracted.text) : [];

  return {
    filename: file.name,
    contentType: file.type || (extension === "pdf" ? "application/pdf" : "application/octet-stream"),
    fileSize: file.size,
    pageCount: extracted.pageCount,
    extractedText: extracted.text,
    entities: analysis.entities,
    keywords: analysis.stats.top_keywords,
    summary: analysis.summary,
    stats: analysis.stats,
    documentType: contract ? "contract" : "general",
    riskFlags,
  };
}
