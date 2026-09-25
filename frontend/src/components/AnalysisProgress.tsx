import type { ProgressUpdate } from "../analysis/analyzeFile";

function readingLabel(progress: ProgressUpdate): string {
  if (progress.phase === "read") {
    return `Reading page ${progress.page} of ${progress.pageCount}`;
  }
  const noun = progress.pageCount === 1 ? "page" : "pages";
  return `Read ${progress.pageCount} ${noun}`;
}

export function AnalysisProgress({ progress }: { progress: ProgressUpdate }) {
  const labels = [readingLabel(progress), "Finding names and keywords", "Checking contract rules"];
  const activeIndex = progress.phase === "read" ? 0 : progress.phase === "entities" ? 1 : 2;

  return (
    <ol className="mt-5 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite">
      {labels.map((label, index) => {
        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
        const rowClass =
          state === "active"
            ? "text-brand-800"
            : state === "done"
              ? "text-slate-700"
              : "text-slate-400";
        const markerClass =
          state === "active"
            ? "bg-brand-600 text-white"
            : state === "done"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-400 ring-1 ring-slate-200";
        return (
          <li key={index} className={`flex items-center gap-3 text-sm font-medium ${rowClass}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${markerClass}`}>
              {state === "done" ? "✓" : index + 1}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
