import type { InsightResponse } from "../types";
import { RiskFlagsPanel } from "./RiskFlagsPanel";

export function InsightsPanel({ insight }: { insight: InsightResponse }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
          {insight.document_type === "contract" && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-700">
              Contract detected
            </span>
          )}
        </div>
        <p className="text-sm text-slate-800">{insight.summary}</p>
      </section>

      {insight.document_type === "contract" && <RiskFlagsPanel flags={insight.risk_flags} />}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Words" value={insight.stats.word_count} />
        <StatCard label="Sentences" value={insight.stats.sentence_count} />
        <StatCard label="Entities" value={insight.stats.entity_count} />
        <StatCard label="Unique entities" value={insight.stats.unique_entity_count} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Entities</h3>
        {insight.entities.length === 0 ? (
          <p className="text-sm text-slate-500">No entities detected.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {insight.entities.map((entity) => (
              <span
                key={`${entity.text}-${entity.label}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {entity.text}
                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-600">
                  {entity.label}
                </span>
                {entity.count > 1 && <span className="text-brand-400">x{entity.count}</span>}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Top keywords</h3>
        {insight.stats.top_keywords.length === 0 ? (
          <p className="text-sm text-slate-500">No keywords extracted.</p>
        ) : (
          <ul className="space-y-1.5">
            {insight.stats.top_keywords.map((kw) => (
              <li key={kw.keyword} className="flex items-center justify-between text-sm text-slate-700">
                <span>{kw.keyword}</span>
                <span className="text-slate-400">{kw.count}</span>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
