import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { InsightsPanel } from "../components/InsightsPanel";
import { getApiErrorMessage, getDocument, getDocumentInsights } from "../lib/api";
import type { DocumentSummary, InsightResponse } from "../types";

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
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-brand-600 underline">
          Back to documents
        </Link>
      </div>
    );
  }

  if (!document) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-slate-500">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="text-sm text-brand-600 underline">
        &larr; Back to documents
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">{document.filename}</h1>
      <p className="mt-1 text-sm capitalize text-slate-500">Status: {document.status}</p>

      {document.status === "failed" && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {document.error_message ?? "Processing failed."}
        </p>
      )}

      {(document.status === "pending" || document.status === "processing") && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Document is being analyzed. This page will update automatically.
        </p>
      )}

      {document.extracted_text && (
        <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            Extracted text
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
            {document.extracted_text}
          </pre>
        </details>
      )}

      {insight && (
        <div className="mt-6">
          <InsightsPanel insight={insight} />
        </div>
      )}
    </div>
  );
}
