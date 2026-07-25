import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getApiErrorMessage, listDocuments, uploadDocument } from "../lib/api";
import { DocumentList } from "../components/DocumentList";
import { UploadDropzone } from "../components/UploadDropzone";
import type { DocumentSummary } from "../types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const document = await uploadDocument(file);
        navigate(`/documents/${document.id}`);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsUploading(false);
        refresh();
      }
    },
    [navigate, refresh]
  );

  const completedCount = documents.filter((doc) => doc.status === "completed").length;
  const reviewCount = documents.filter((doc) => doc.status === "processing" || doc.status === "pending").length;
  const failedCount = documents.filter((doc) => doc.status === "failed").length;
  const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-brand-700">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">Analyze a document</h1>
            </div>
            <p className="text-sm text-slate-500">PDF and image files up to 25MB</p>
          </div>

          <div className="mt-5">
            <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>

        <aside className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <MetricCard label="Documents" value={documents.length.toString()} />
          <MetricCard label="Completed" value={completedCount.toString()} tone="success" />
          <MetricCard label="In review" value={reviewCount.toString()} tone="warning" />
          <MetricCard label={failedCount > 0 ? "Failed" : "Stored"} value={failedCount > 0 ? failedCount.toString() : formatBytes(totalSize)} tone={failedCount > 0 ? "danger" : "neutral"} />
        </aside>
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Your documents</h2>
            <p className="text-sm text-slate-500">{isLoading ? "Loading..." : `${documents.length} total`}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading || isUploading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        {isLoading ? (
          <DocumentListSkeleton />
        ) : (
          <DocumentList documents={documents} />
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "border-slate-200 bg-white text-slate-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold">{value}</p>
    </div>
  );
}

function DocumentListSkeleton() {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-4 border-b border-slate-100 px-4 py-4 last:border-b-0">
          <div className="h-10 w-10 rounded-lg bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-slate-100" />
            <div className="h-3 w-1/4 rounded bg-slate-100" />
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
