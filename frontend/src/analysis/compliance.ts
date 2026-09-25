/**
 * Port of backend/app/services/compliance.py.
 * compliance.test.ts locks this to the Python output in compliance.expected.json.
 */

export interface RiskFlag {
  type: string;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: string | null;
}

interface ClauseRule {
  key: string;
  label: string;
  pattern: string;
}

const CONTRACT_SIGNAL_SOURCE =
  "\\b(agreement|hereinafter|hereby|witnesseth|the parties|effective date|shall not|governing law|in witness whereof)\\b";
const CONTRACT_SIGNAL_THRESHOLD = 3;

const STANDARD_CLAUSES: ClauseRule[] = [
  { key: "termination", label: "Termination clause", pattern: "\\btermination\\b" },
  {
    key: "limitation_of_liability",
    label: "Limitation of liability clause",
    pattern: "\\blimitation of liability\\b|\\blimit(?:s|ed)?\\s+(?:its|their|liability)\\b",
  },
  { key: "indemnification", label: "Indemnification clause", pattern: "\\bindemnif(?:y|ies|ication)\\b" },
  { key: "confidentiality", label: "Confidentiality clause", pattern: "\\bconfidential(?:ity)?\\b" },
  {
    key: "governing_law",
    label: "Governing law clause",
    pattern: "\\bgoverning law\\b|\\bgoverned by the laws of\\b",
  },
  {
    key: "dispute_resolution",
    label: "Dispute resolution / arbitration clause",
    pattern: "\\barbitration\\b|\\bdispute resolution\\b",
  },
];

const AUTO_RENEWAL_SOURCE =
  "(automatically renew(?:s|ed|al)?|auto-renew(?:s|al)?|evergreen clause)";
const NOTICE_PERIOD_SOURCE = "written notice of (?:at least\\s+)?(\\d+)\\s*days?";
const NOTICE_PERIOD_MIN_DAYS = 30;

const NET_TERMS_SOURCE = "\\bnet[\\s-]?(\\d{2,3})\\b";
const NET_TERMS_MAX_DAYS = 60;
const UPFRONT_PAYMENT_SOURCE =
  "\\b(100%|full(?:\\s+amount)?|entire amount) (?:payment )?(?:due |payable )?(?:in advance|upfront|up front)\\b";

const GOVERNING_LAW_JURISDICTION_SOURCE =
  "(?:governed by|governing law)[\\s\\S]{0,100}?(?:laws of|state of|province of|country of)\\s+(?!the\\b|a\\b|an\\b)([A-Za-z][A-Za-z\\s]{1,40}?)(?=[.,;\\n]|$)";

function matchPattern(source: string, text: string, flags = "i"): RegExpMatchArray | null {
  return new RegExp(source, flags).exec(text);
}

function allMatches(source: string, text: string, flags = "gi"): RegExpMatchArray[] {
  return [...text.matchAll(new RegExp(source, flags))];
}

export function isLikelyContract(text: string): boolean {
  return allMatches(CONTRACT_SIGNAL_SOURCE, text).length >= CONTRACT_SIGNAL_THRESHOLD;
}

function snippet(text: string, match: RegExpMatchArray, radius = 60): string {
  const start = Math.max((match.index ?? 0) - radius, 0);
  const end = Math.min((match.index ?? 0) + match[0].length + radius, text.length);
  const clipped = text.slice(start, end).trim().replaceAll("\n", " ");
  return start > 0 || end < text.length ? `...${clipped}...` : clipped;
}

function checkMissingClauses(text: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  for (const clause of STANDARD_CLAUSES) {
    if (!matchPattern(clause.pattern, text)) {
      flags.push({
        type: "missing_clause",
        severity: "medium",
        title: `Missing: ${clause.label}`,
        description:
          `No ${clause.label.toLowerCase()} was detected in this document. ` +
          "Consider verifying whether this protection is covered elsewhere " +
          "or should be added.",
        evidence: null,
      });
    }
  }
  return flags;
}

function checkAutoRenewal(text: string): RiskFlag[] {
  const match = matchPattern(AUTO_RENEWAL_SOURCE, text);
  if (!match) return [];

  const flags: RiskFlag[] = [
    {
      type: "auto_renewal",
      severity: "medium",
      title: "Automatic renewal clause detected",
      description:
        "This document automatically renews unless action is taken. " +
        "Confirm the opt-out notice window and calendar it.",
      evidence: snippet(text, match),
    },
  ];

  const noticeMatch = matchPattern(NOTICE_PERIOD_SOURCE, text);
  if (noticeMatch) {
    const days = Number(noticeMatch[1]);
    if (days < NOTICE_PERIOD_MIN_DAYS) {
      flags.push({
        type: "auto_renewal",
        severity: "high",
        title: "Short auto-renewal opt-out window",
        description:
          `Auto-renewal requires only ${days} days' written notice to cancel, ` +
          `below the commonly recommended ${NOTICE_PERIOD_MIN_DAYS}-day minimum.`,
        evidence: snippet(text, noticeMatch),
      });
    }
  } else {
    flags.push({
      type: "auto_renewal",
      severity: "high",
      title: "Auto-renewal with no clear opt-out notice period",
      description:
        "An auto-renewal clause was found but no explicit notice period " +
        "(e.g. 'written notice of 30 days') could be identified.",
      evidence: null,
    });
  }
  return flags;
}

function checkPaymentTerms(text: string): RiskFlag[] {
  const flags: RiskFlag[] = [];
  for (const match of allMatches(NET_TERMS_SOURCE, text)) {
    const days = Number(match[1]);
    if (days > NET_TERMS_MAX_DAYS) {
      flags.push({
        type: "payment_terms",
        severity: "medium",
        title: `Unusually long payment term (Net ${days})`,
        description:
          `Payment terms of Net ${days} exceed the common ${NET_TERMS_MAX_DAYS}-day ` +
          "threshold, which may strain cash flow.",
        evidence: snippet(text, match),
      });
    }
  }

  const upfrontMatch = matchPattern(UPFRONT_PAYMENT_SOURCE, text);
  if (upfrontMatch) {
    flags.push({
      type: "payment_terms",
      severity: "medium",
      title: "Full payment required in advance",
      description:
        "This document requires full payment upfront, which is less favorable " +
        "than milestone- or delivery-based payment terms.",
      evidence: snippet(text, upfrontMatch),
    });
  }
  return flags;
}

function cleanJurisdiction(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/\.+$/, "");
}

function checkJurisdictionConflicts(text: string): RiskFlag[] {
  const matches = allMatches(GOVERNING_LAW_JURISDICTION_SOURCE, text);
  const jurisdictions = new Set(matches.map((match) => cleanJurisdiction(match[1] ?? "")));
  jurisdictions.delete("");
  if (jurisdictions.size > 1) {
    const match = matches[0];
    return [
      {
        type: "jurisdiction_conflict",
        severity: "high",
        title: "Conflicting governing law / jurisdiction clauses",
        description:
          "Multiple different governing-law jurisdictions were found in this " +
          `document: ${[...jurisdictions].sort().join(", ")}. This may indicate ` +
          "conflicting or copy-pasted clauses that need legal review.",
        evidence: snippet(text, match),
      },
    ];
  }
  return [];
}

const SEVERITY_ORDER: Record<RiskFlag["severity"], number> = { high: 0, medium: 1, low: 2 };

export function scanContract(text: string): RiskFlag[] {
  const flags: RiskFlag[] = [
    ...checkMissingClauses(text),
    ...checkAutoRenewal(text),
    ...checkPaymentTerms(text),
    ...checkJurisdictionConflicts(text),
  ];
  flags.sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]);
  return flags;
}
