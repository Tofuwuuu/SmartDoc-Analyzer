import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { loadBrowserResult } from "../analysis/resultStore";
import type { AnalysisResult } from "../analysis/analyzeFile";
import { ResultsView } from "../components/ResultsView";

function resultFromState(value: unknown): AnalysisResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<AnalysisResult>;
  if (typeof record.filename !== "string" || typeof record.extractedText !== "string" || !Array.isArray(record.riskFlags)) {
    return null;
  }
  return value as AnalysisResult;
}

export function ResultsPage() {
  const location = useLocation();
  const [result] = useState<AnalysisResult | null>(() => resultFromState(location.state) ?? loadBrowserResult());

  return (
    <main id="results" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800">
        &larr; Analyze another document
      </Link>
      <div className="mt-4">
        {result ? (
          <ResultsView result={result} />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-slate-950">No results yet</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try the sample contract or upload a PDF or image.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
