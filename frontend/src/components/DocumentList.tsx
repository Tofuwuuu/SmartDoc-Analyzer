import { Link } from "react-router-dom";

import type { DocumentSummary } from "../types";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  processing: "bg-amber-50 text-amber-700 ring-amber-200",
  pending: "bg-slate-50 text-slate-700 ring-slate-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

const STATUS_DOTS: Record<string, string> = {
  completed: "bg-emerald-500",
  processing: "bg-amber-500",
  pending: "bg-slate-400",
  failed: "bg-red-500",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: DocumentSummary[] }) {
  if (documents.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FileIcon />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-800">No documents yet</p>
        <p className="mt-1 text-sm text-slate-500">Uploaded files will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {documents.map((doc) => (
        <li key={doc.id} className="border-b border-slate-100 last:border-b-0">
          <Link
            to={`/documents/${doc.id}`}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FileIcon />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">{doc.filename}</p>
              <p className="mt-1 text-xs text-slate-500">
                {formatBytes(doc.file_size)} &middot; {new Date(doc.created_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${
                STATUS_STYLES[doc.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[doc.status] ?? "bg-slate-400"}`} />
              {doc.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 3h6l4 4v14H7V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 3v5h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
