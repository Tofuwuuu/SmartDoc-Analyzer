import { useEffect, useRef } from "react";

import type { AnalysisResult } from "../analysis/analyzeFile";
import { RiskFlagsPanel } from "./RiskFlagsPanel";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResultsView({ result }: { result: AnalysisResult }) {
  const wordCount = result.extractedText.trim() ? result.extractedText.trim().split(/\s+/).length : 0;
  const textRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      if (textRef.current) textRef.current.open = media.matches;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return (
    <div>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-brand-700">Results</p>
        <h1 className="mt-1 break-words text-2xl font-semibold text-slate-950">{result.filename}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>{formatBytes(result.fileSize)}</span>
          <span>&middot;</span>
          <span>
            {result.pageCount} {result.pageCount === 1 ? "page" : "pages"}
          </span>
          <span>&middot;</span>
          <span>{wordCount} words</span>
          <span>&middot;</span>
          <span>{result.documentType === "contract" ? "Contract" : "Not a contract"}</span>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <RiskFlagsPanel flags={result.riskFlags} scanned={result.documentType === "contract"} />
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-start-2 lg:row-start-1">
          <h2 className="text-sm font-semibold uppercase text-slate-500">Entities and keywords</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{result.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Entities" value={result.stats.unique_entity_count} />
            <Stat label="Keywords" value={result.keywords.length} />
          </dl>

          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase text-slate-500">Named entities</h3>
          {result.entities.length === 0 ? (
            <p className="text-sm text-slate-500">No names, organizations, or places detected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {result.entities.map((entity) => (
                <span
                  key={`${entity.label}-${entity.text}`}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  <span className="truncate">{entity.text}</span>
                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
                    {entity.label}
                  </span>
                  {entity.count > 1 && <span className="text-slate-400">x{entity.count}</span>}
                </span>
              ))}
            </div>
          )}

          <h3 className="mb-3 mt-5 text-xs font-semibold uppercase text-slate-500">Keywords</h3>
          {result.keywords.length === 0 ? (
            <p className="text-sm text-slate-500">No keywords extracted.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {result.keywords.map((keyword) => (
                <li key={keyword.keyword} className="flex items-center justify-between gap-4 py-2 text-sm text-slate-700">
                  <span className="truncate">{keyword.keyword}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {keyword.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2">
          <details ref={textRef} className="extract-text rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary
              className="cursor-pointer list-none px-5 py-4 text-sm font-semibold uppercase text-slate-500"
              onClick={(event) => {
                if (window.matchMedia("(min-width: 1024px)").matches) event.preventDefault();
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span>Extracted text</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium normal-case text-slate-600">
                  {wordCount} words
                </span>
              </span>
            </summary>
            {result.extractedText ? (
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap border-t border-slate-100 px-5 py-4 text-xs leading-6 text-slate-800">
                {result.extractedText}
              </pre>
            ) : (
              <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
                No extracted text available.
              </p>
            )}
          </details>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
