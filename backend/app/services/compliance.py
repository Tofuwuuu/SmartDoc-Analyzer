"""Rule-based contract risk scanner.

Patterns, labels, severities, and message text live in shared/contract-rules.json.
The TypeScript analyzer reads that same file.
"""

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


@lru_cache(maxsize=1)
def load_rules() -> dict[str, Any]:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "shared" / "contract-rules.json"
        if candidate.is_file():
            return json.loads(candidate.read_text(encoding="utf-8"))
    raise FileNotFoundError("Could not find shared/contract-rules.json")


def _fill(template: str, **values: object) -> str:
    return template.format(**values)


def _pattern(source: str) -> re.Pattern[str]:
    return re.compile(source, re.IGNORECASE)


def _snippet(text: str, match: re.Match[str], radius: int) -> str:
    start = max(match.start() - radius, 0)
    end = min(match.end() + radius, len(text))
    snippet = text[start:end].strip().replace("\n", " ")
    return f"...{snippet}..." if start > 0 or end < len(text) else snippet


def _flag(rule: dict[str, Any], evidence: str | None, **values: object) -> dict[str, Any]:
    return {
        "type": rule["type"],
        "severity": rule["severity"],
        "title": _fill(rule["title"], **values),
        "description": _fill(rule["description"], **values),
        "evidence": evidence,
    }


def is_likely_contract(text: str) -> bool:
    signals = load_rules()["contractSignals"]
    matches = _pattern(signals["pattern"]).findall(text)
    return len(matches) >= int(signals["threshold"])


def _check_missing_clauses(text: str, rules: dict[str, Any]) -> list[dict[str, Any]]:
    spec = rules["missingClauses"]
    flags = []
    for clause in spec["clauses"]:
        if _pattern(clause["pattern"]).search(text):
            continue
        flags.append(
            _flag(
                spec,
                None,
                label=clause["label"],
                label_lower=clause["label"].lower(),
            )
        )
    return flags


def _check_auto_renewal(text: str, rules: dict[str, Any]) -> list[dict[str, Any]]:
    spec = rules["autoRenewal"]
    match = _pattern(spec["pattern"]).search(text)
    if not match:
        return []

    radius = int(rules["snippetRadius"])
    flags = [_flag(spec["detected"], _snippet(text, match, radius))]

    notice = spec["notice"]
    notice_match = _pattern(notice["pattern"]).search(text)
    if notice_match:
        days = int(notice_match.group(1))
        if days < int(notice["minDays"]):
            flags.append(
                _flag(
                    notice["short"],
                    _snippet(text, notice_match, radius),
                    days=days,
                    min_days=notice["minDays"],
                )
            )
    else:
        flags.append(_flag(notice["missing"], None))
    return flags


def _check_payment_terms(text: str, rules: dict[str, Any]) -> list[dict[str, Any]]:
    spec = rules["paymentTerms"]
    radius = int(rules["snippetRadius"])
    flags = []
    net = spec["net"]
    for match in _pattern(net["pattern"]).finditer(text):
        days = int(match.group(1))
        if days > int(net["maxDays"]):
            flags.append(
                _flag(
                    net,
                    _snippet(text, match, radius),
                    days=days,
                    max_days=net["maxDays"],
                )
            )

    upfront = spec["upfront"]
    upfront_match = _pattern(upfront["pattern"]).search(text)
    if upfront_match:
        flags.append(_flag(upfront, _snippet(text, upfront_match, radius)))
    return flags


def _clean_jurisdiction(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip().rstrip(".")


def _check_jurisdiction(text: str, rules: dict[str, Any]) -> list[dict[str, Any]]:
    spec = rules["jurisdiction"]
    matches = list(_pattern(spec["pattern"]).finditer(text))
    jurisdictions = {_clean_jurisdiction(match.group(1)) for match in matches}
    jurisdictions.discard("")
    if len(jurisdictions) <= 1:
        return []
    return [
        _flag(
            spec,
            _snippet(text, matches[0], int(rules["snippetRadius"])),
            names=", ".join(sorted(jurisdictions)),
        )
    ]


_CHECKERS = {
    "missingClauses": _check_missing_clauses,
    "autoRenewal": _check_auto_renewal,
    "paymentTerms": _check_payment_terms,
    "jurisdiction": _check_jurisdiction,
}


def scan_contract(text: str) -> list[dict[str, Any]]:
    """Run all rule-based checks and return a flat list of risk flags."""
    rules = load_rules()
    flags: list[dict[str, Any]] = []
    for name in rules["checkOrder"]:
        flags.extend(_CHECKERS[name](text, rules))

    order = {severity: index for index, severity in enumerate(rules["severityOrder"])}
    flags.sort(key=lambda flag: order.get(flag["severity"], len(order)))
    return flags
