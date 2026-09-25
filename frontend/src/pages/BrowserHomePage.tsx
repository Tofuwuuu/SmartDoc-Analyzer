import { useState } from "react";
import { useNavigate } from "react-router-dom";

import type { ProgressUpdate } from "../analysis/analyzeFile";
import { saveBrowserResult } from "../analysis/resultStore";
import { AnalysisProgress } from "../components/AnalysisProgress";
import { UploadDropzone } from "../components/UploadDropzone";

const SAMPLE_URL = "/samples/service-agreement.pdf";

export function BrowserHomePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (file: File) => {
    setError(null);
    setProgress({ phase: "read", page: 1, pageCount: 1 });
    try {
      const { analyzeFile } = await import("../analysis/analyzeFile");
      const result = await analyzeFile(file, setProgress);
      saveBrowserResult(result);
      navigate("/results", { state: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze this file.");
      setProgress(null);
    }
  };

  const handleSample = async () => {
    setError(null);
    setProgress({ phase: "read", page: 1, pageCount: 1 });
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) {
        throw new Error("Could not load the sample document.");
      }
      const blob = await response.blob();
      const file = new File([blob], "service-agreement.pdf", { type: "application/pdf" });
      const { analyzeFile } = await import("../analysis/analyzeFile");
      const result = await analyzeFile(file, setProgress);
      saveBrowserResult(result);
      navigate("/results", { state: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyze the sample document.");
      setProgress(null);
    }
  };

  const busy = progress !== null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase text-brand-700">In your browser</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Analyze a document</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Upload a PDF or scan and get the extracted text, OCR for images, named entities and keywords, and
          rule-based contract risk flags.
        </p>

        <button
          id="try-sample"
          type="button"
          onClick={handleSample}
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Try a sample document
        </button>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Or upload your own</p>
          <UploadDropzone
            onUpload={run}
            isUploading={busy}
            hint="PDF, PNG, JPG, TIFF, BMP, or WEBP. Up to 5 MB and 10 pages."
          />
          <p className="mt-2 text-xs text-slate-500">Your file stays on your device.</p>
        </div>

        {progress && <AnalysisProgress progress={progress} />}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
