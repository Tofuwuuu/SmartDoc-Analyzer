import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { InsightsPanel } from "../components/InsightsPanel";
import { getApiErrorMessage, getDocument, getDocumentInsights } from "../lib/api";
import type { DocumentSummary, InsightResponse } from "../types";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-slate-50 text-slate-700 ring-slate-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentSummary | null>(null);
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const doc = await getDocument(id);
      setDocument(doc);
      if (doc.status === "completed") {
        const insightData = await getDocumentInsights(id);
        setInsight(insightData);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (document && (document.status === "processing" || document.status === "pending")) {
      const interval = setInterval(load, 2000);
      return () => clearInterval(interval);
    }
  }, [document, load]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">
          Back to documents
        </Link>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-36 rounded bg-slate-100" />
          <div className="mt-5 h-8 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-4 w-1/3 rounded bg-slate-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-brand-700 hover:text-brand-800">
        &larr; Back to documents
      </Link>

      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-brand-700">Document</p>
            <h1 className="mt-1 break-words text-2xl font-semibold text-slate-950">
              {document.filename}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{formatBytes(document.file_size)}</span>
              <span>&middot;</span>
              <span>{new Date(document.created_at).toLocaleString()}</span>
              <span>&middot;</span>
              <span>{document.content_type}</span>
            </div>
          </div>
          <span
            className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
              STATUS_STYLES[document.status] ?? "bg-slate-50 text-slate-700 ring-slate-200"
            }`}
          >
            {document.status}
          </span>
        </div>

        {document.status === "failed" && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {document.error_message ?? "Processing failed."}
          </p>
        )}

        {(document.status === "pending" || document.status === "processing") && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Document is being analyzed. This page will update automatically.
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-slate-500">Extracted text</h2>
            {document.extracted_text && (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {document.extracted_text.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
          {document.extracted_text ? (
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100">
              {document.extracted_text}
            </pre>
          ) : (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No extracted text available.
            </p>
          )}
        </section>

        <section>
          {insight ? (
            <InsightsPanel insight={insight} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Insights will appear when analysis is complete.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
