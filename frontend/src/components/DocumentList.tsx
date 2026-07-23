import { Link } from "react-router-dom";

import type { DocumentSummary } from "../types";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-700",
  failed: "bg-red-100 text-red-700",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: DocumentSummary[] }) {
  if (documents.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-slate-500">
        No documents uploaded yet. Upload one above to get started.
      </p>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Link
            to={`/documents/${doc.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{doc.filename}</p>
              <p className="text-xs text-slate-500">
                {formatBytes(doc.file_size)} &middot; {new Date(doc.created_at).toLocaleString()}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                STATUS_STYLES[doc.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {doc.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
