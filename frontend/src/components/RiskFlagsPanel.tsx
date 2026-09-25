import type { RiskFlag, RiskSeverity } from "../types";

const SEVERITY_STYLES: Record<RiskSeverity, { badge: string; card: string; label: string }> = {
  high: {
    badge: "bg-red-100 text-red-700",
    card: "border-red-200 bg-red-50/70",
    label: "High risk",
  },
  medium: {
    badge: "bg-amber-100 text-amber-700",
    card: "border-amber-200 bg-amber-50/70",
    label: "Medium risk",
  },
  low: {
    badge: "bg-slate-100 text-slate-700",
    card: "border-slate-200 bg-slate-50/70",
    label: "Low risk",
  },
};

function severityRank(severity: RiskSeverity): number {
  return severity === "high" ? 0 : severity === "medium" ? 1 : 2;
}

export function RiskFlagsPanel({ flags, scanned = true }: { flags: RiskFlag[]; scanned?: boolean }) {
  const sorted = [...flags].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  const counts = flags.reduce(
    (acc, flag) => ({ ...acc, [flag.severity]: (acc[flag.severity] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold uppercase text-slate-500">Compliance risk flags</h3>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {(["high", "medium", "low"] as RiskSeverity[]).map(
            (sev) =>
              counts[sev] > 0 && (
                <span key={sev} className={`rounded-full px-2 py-0.5 ${SEVERITY_STYLES[sev].badge}`}>
                  {counts[sev]} {sev}
                </span>
              )
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm leading-6 text-slate-500">
          {scanned
            ? "No compliance risk flags detected. This document was checked for missing clauses, auto-renewal, payment terms, and jurisdiction conflicts."
            : "This text does not look like a contract, so the contract rules were not applied."}
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((flag, idx) => {
            const style = SEVERITY_STYLES[flag.severity] ?? SEVERITY_STYLES.low;
            return (
              <li key={`${flag.type}-${idx}`} className={`rounded-lg border p-3 ${style.card}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-900">{flag.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.badge}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-700">{flag.description}</p>
                {flag.evidence && (
                  <p className="mt-2 rounded-lg bg-white/80 px-2 py-1 text-xs italic text-slate-500">
                    "{flag.evidence}"
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
