"""Rule-based contract risk scanner.

Answers "what should I worry about?" rather than generic NER stats: detects
missing standard clauses, risky auto-renewal terms, unusual payment terms,
and conflicting governing-law/jurisdiction clauses.
"""

import re
from typing import Any

CONTRACT_SIGNAL_PATTERN = re.compile(
    r"\b(agreement|hereinafter|hereby|witnesseth|the parties|effective date|"
    r"shall not|governing law|in witness whereof)\b",
    re.IGNORECASE,
)
CONTRACT_SIGNAL_THRESHOLD = 3

STANDARD_CLAUSES: list[dict[str, str]] = [
    {
        "key": "termination",
        "label": "Termination clause",
        "pattern": r"\btermination\b",
    },
    {
        "key": "limitation_of_liability",
        "label": "Limitation of liability clause",
        "pattern": r"\blimitation of liability\b|\blimit(?:s|ed)?\s+(?:its|their|liability)\b",
    },
    {
        "key": "indemnification",
        "label": "Indemnification clause",
        "pattern": r"\bindemnif(?:y|ies|ication)\b",
    },
    {
        "key": "confidentiality",
        "label": "Confidentiality clause",
        "pattern": r"\bconfidential(?:ity)?\b",
    },
    {
        "key": "governing_law",
        "label": "Governing law clause",
        "pattern": r"\bgoverning law\b|\bgoverned by the laws of\b",
    },
    {
        "key": "dispute_resolution",
        "label": "Dispute resolution / arbitration clause",
        "pattern": r"\barbitration\b|\bdispute resolution\b",
    },
]

AUTO_RENEWAL_PATTERN = re.compile(
    r"(automatically renew(?:s|ed|al)?|auto-renew(?:s|al)?|evergreen clause)",
    re.IGNORECASE,
)
NOTICE_PERIOD_PATTERN = re.compile(
    r"written notice of (?:at least\s+)?(\d+)\s*days?", re.IGNORECASE
)
NOTICE_PERIOD_MIN_DAYS = 30

NET_TERMS_PATTERN = re.compile(r"\bnet[\s-]?(\d{2,3})\b", re.IGNORECASE)
NET_TERMS_MAX_DAYS = 60
UPFRONT_PAYMENT_PATTERN = re.compile(
    r"\b(100%|full(?:\s+amount)?|entire amount) (?:payment )?(?:due |payable )?(?:in advance|upfront|up front)\b",
    re.IGNORECASE,
)

GOVERNING_LAW_JURISDICTION_PATTERN = re.compile(
    r"(?:governed by|governing law)[\s\S]{0,100}?(?:laws of|state of|province of|country of)\s+"
    r"(?!the\b|a\b|an\b)([A-Za-z][A-Za-z\s]{1,40}?)(?=[\.,;\n]|$)",
    re.IGNORECASE,
)


def is_likely_contract(text: str) -> bool:
    matches = CONTRACT_SIGNAL_PATTERN.findall(text)
    return len(matches) >= CONTRACT_SIGNAL_THRESHOLD


def _snippet(text: str, match: re.Match, radius: int = 60) -> str:
    start = max(match.start() - radius, 0)
    end = min(match.end() + radius, len(text))
    snippet = text[start:end].strip().replace("\n", " ")
    return f"...{snippet}..." if start > 0 or end < len(text) else snippet


def _check_missing_clauses(text: str) -> list[dict[str, Any]]:
    flags = []
    for clause in STANDARD_CLAUSES:
        if not re.search(clause["pattern"], text, re.IGNORECASE):
            flags.append(
                {
                    "type": "missing_clause",
                    "severity": "medium",
                    "title": f"Missing: {clause['label']}",
                    "description": (
                        f"No {clause['label'].lower()} was detected in this document. "
                        "Consider verifying whether this protection is covered elsewhere "
                        "or should be added."
                    ),
                    "evidence": None,
                }
            )
    return flags


def _check_auto_renewal(text: str) -> list[dict[str, Any]]:
    match = AUTO_RENEWAL_PATTERN.search(text)
    if not match:
        return []

    flags = [
        {
            "type": "auto_renewal",
            "severity": "medium",
            "title": "Automatic renewal clause detected",
            "description": (
                "This document automatically renews unless action is taken. "
                "Confirm the opt-out notice window and calendar it."
            ),
            "evidence": _snippet(text, match),
        }
    ]

    notice_match = NOTICE_PERIOD_PATTERN.search(text)
    if notice_match:
        days = int(notice_match.group(1))
        if days < NOTICE_PERIOD_MIN_DAYS:
            flags.append(
                {
                    "type": "auto_renewal",
                    "severity": "high",
                    "title": "Short auto-renewal opt-out window",
                    "description": (
                        f"Auto-renewal requires only {days} days' written notice to cancel, "
                        f"below the commonly recommended {NOTICE_PERIOD_MIN_DAYS}-day minimum."
                    ),
                    "evidence": _snippet(text, notice_match),
                }
            )
    else:
        flags.append(
            {
                "type": "auto_renewal",
                "severity": "high",
                "title": "Auto-renewal with no clear opt-out notice period",
                "description": (
                    "An auto-renewal clause was found but no explicit notice period "
                    "(e.g. 'written notice of 30 days') could be identified."
                ),
                "evidence": None,
            }
        )
    return flags


def _check_payment_terms(text: str) -> list[dict[str, Any]]:
    flags = []
    for match in NET_TERMS_PATTERN.finditer(text):
        days = int(match.group(1))
        if days > NET_TERMS_MAX_DAYS:
            flags.append(
                {
                    "type": "payment_terms",
                    "severity": "medium",
                    "title": f"Unusually long payment term (Net {days})",
                    "description": (
                        f"Payment terms of Net {days} exceed the common {NET_TERMS_MAX_DAYS}-day "
                        "threshold, which may strain cash flow."
                    ),
                    "evidence": _snippet(text, match),
                }
            )

    upfront_match = UPFRONT_PAYMENT_PATTERN.search(text)
    if upfront_match:
        flags.append(
            {
                "type": "payment_terms",
                "severity": "medium",
                "title": "Full payment required in advance",
                "description": (
                    "This document requires full payment upfront, which is less favorable "
                    "than milestone- or delivery-based payment terms."
                ),
                "evidence": _snippet(text, upfront_match),
            }
        )
    return flags


def _check_jurisdiction_conflicts(text: str) -> list[dict[str, Any]]:
    jurisdictions = {
        re.sub(r"\s+", " ", match.group(1)).strip().rstrip(".")
        for match in GOVERNING_LAW_JURISDICTION_PATTERN.finditer(text)
    }
    if len(jurisdictions) > 1:
        match = next(GOVERNING_LAW_JURISDICTION_PATTERN.finditer(text))
        return [
            {
                "type": "jurisdiction_conflict",
                "severity": "high",
                "title": "Conflicting governing law / jurisdiction clauses",
                "description": (
                    "Multiple different governing-law jurisdictions were found in this "
                    f"document: {', '.join(sorted(jurisdictions))}. This may indicate "
                    "conflicting or copy-pasted clauses that need legal review."
                ),
                "evidence": _snippet(text, match),
            }
        ]
    return []


def scan_contract(text: str) -> list[dict[str, Any]]:
    """Run all rule-based checks and return a flat list of risk flags."""
    flags: list[dict[str, Any]] = []
    flags.extend(_check_missing_clauses(text))
    flags.extend(_check_auto_renewal(text))
    flags.extend(_check_payment_terms(text))
    flags.extend(_check_jurisdiction_conflicts(text))

    severity_order = {"high": 0, "medium": 1, "low": 2}
    flags.sort(key=lambda f: severity_order.get(f["severity"], 3))
    return flags
