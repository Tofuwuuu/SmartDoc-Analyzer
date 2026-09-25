import type { AnalysisResult } from "./analyzeFile";

const STORAGE_KEY = "smartdoc.browserResult";

export function saveBrowserResult(result: AnalysisResult): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadBrowserResult(): AnalysisResult | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Partial<AnalysisResult>;
    if (typeof record.filename !== "string" || typeof record.extractedText !== "string" || !Array.isArray(record.riskFlags)) {
      return null;
    }
    return parsed as AnalysisResult;
  } catch {
    return null;
  }
}
