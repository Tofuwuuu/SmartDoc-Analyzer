import type { InsightResponse } from "../types";
import { RiskFlagsPanel } from "./RiskFlagsPanel";

export function InsightsPanel({ insight }: { insight: InsightResponse }) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase text-slate-500">Summary</h3>
          {insight.document_type === "contract" && (
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-brand-700 ring-1 ring-brand-100">
              Contract detected
            </span>
          )}
        </div>
        <p className="text-sm leading-6 text-slate-800">{insight.summary}</p>
      </section>

      {insight.document_type === "contract" && <RiskFlagsPanel flags={insight.risk_flags} />}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Words" value={insight.stats.word_count} />
        <StatCard label="Sentences" value={insight.stats.sentence_count} />
        <StatCard label="Entities" value={insight.stats.entity_count} />
        <StatCard label="Unique entities" value={insight.stats.unique_entity_count} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Entities</h3>
        {insight.entities.length === 0 ? (
          <p className="text-sm text-slate-500">No entities detected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {insight.entities.map((entity) => (
              <span
                key={`${entity.text}-${entity.label}`}
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
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase text-slate-500">Top keywords</h3>
        {insight.stats.top_keywords.length === 0 ? (
          <p className="text-sm text-slate-500">No keywords extracted.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {insight.stats.top_keywords.map((kw) => (
              <li key={kw.keyword} className="flex items-center justify-between gap-4 py-2 text-sm text-slate-700">
                <span className="truncate">{kw.keyword}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {kw.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-semibold text-slate-950">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
