/**
 * Contract checks driven by shared/contract-rules.json, the same file compliance.py reads.
 */

import rules from "../../../shared/contract-rules.json";

export interface RiskFlag {
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: string | null;
}

function fill(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function matchPattern(source: string, text: string): RegExpMatchArray | null {
  return new RegExp(source, "i").exec(text);
}

function allMatches(source: string, text: string): RegExpMatchArray[] {
  return [...text.matchAll(new RegExp(source, "gi"))];
}

function snippet(text: string, match: RegExpMatchArray): string {
  const radius = rules.snippetRadius;
  const start = Math.max((match.index ?? 0) - radius, 0);
  const end = Math.min((match.index ?? 0) + match[0].length + radius, text.length);
  const clipped = text.slice(start, end).trim().replaceAll("\n", " ");
  return start > 0 || end < text.length ? `...${clipped}...` : clipped;
}

function flag(
  template: { type: string; severity: string; title: string; description: string },
  evidence: string | null,
  values: Record<string, string | number> = {},
): RiskFlag {
  return {
    type: template.type,
    severity: template.severity as RiskFlag["severity"],
    title: fill(template.title, values),
    description: fill(template.description, values),
    evidence,
  };
}

export function isLikelyContract(text: string): boolean {
  return allMatches(rules.contractSignals.pattern, text).length >= rules.contractSignals.threshold;
}

function checkMissingClauses(text: string): RiskFlag[] {
  const spec = rules.missingClauses;
  return spec.clauses
    .filter((clause) => !matchPattern(clause.pattern, text))
    .map((clause) =>
      flag(spec, null, {
        label: clause.label,
        label_lower: clause.label.toLowerCase(),
      }),
    );
}

function checkAutoRenewal(text: string): RiskFlag[] {
  const spec = rules.autoRenewal;
  const match = matchPattern(spec.pattern, text);
  if (!match) return [];

  const found: RiskFlag[] = [flag(spec.detected, snippet(text, match))];
  const noticeMatch = matchPattern(spec.notice.pattern, text);
  if (noticeMatch) {
    const days = Number(noticeMatch[1]);
    if (days < spec.notice.minDays) {
      found.push(
        flag(spec.notice.short, snippet(text, noticeMatch), {
          days,
          min_days: spec.notice.minDays,
        }),
      );
    }
  } else {
    found.push(flag(spec.notice.missing, null));
  }
  return found;
}

function checkPaymentTerms(text: string): RiskFlag[] {
  const found: RiskFlag[] = [];
  const net = rules.paymentTerms.net;
  for (const match of allMatches(net.pattern, text)) {
    const days = Number(match[1]);
    if (days > net.maxDays) {
      found.push(flag(net, snippet(text, match), { days, max_days: net.maxDays }));
    }
  }

  const upfrontMatch = matchPattern(rules.paymentTerms.upfront.pattern, text);
  if (upfrontMatch) {
    found.push(flag(rules.paymentTerms.upfront, snippet(text, upfrontMatch)));
  }
  return found;
}

function cleanJurisdiction(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/\.+$/, "");
}

function checkJurisdiction(text: string): RiskFlag[] {
  const spec = rules.jurisdiction;
  const matches = allMatches(spec.pattern, text);
  const jurisdictions = new Set(matches.map((match) => cleanJurisdiction(match[1] ?? "")));
  jurisdictions.delete("");
  if (jurisdictions.size <= 1 || matches.length === 0) return [];
  return [
    flag(spec, snippet(text, matches[0]), {
      names: [...jurisdictions].sort().join(", "),
    }),
  ];
}

const CHECKERS: Record<string, (text: string) => RiskFlag[]> = {
  missingClauses: checkMissingClauses,
  autoRenewal: checkAutoRenewal,
  paymentTerms: checkPaymentTerms,
  jurisdiction: checkJurisdiction,
};

const SEVERITY_ORDER = new Map(rules.severityOrder.map((severity, index) => [severity, index]));

export function scanContract(text: string): RiskFlag[] {
  const found = rules.checkOrder.flatMap((name) => CHECKERS[name](text));
  found.sort(
    (left, right) =>
      (SEVERITY_ORDER.get(left.severity) ?? rules.severityOrder.length) -
      (SEVERITY_ORDER.get(right.severity) ?? rules.severityOrder.length),
  );
  return found;
}
