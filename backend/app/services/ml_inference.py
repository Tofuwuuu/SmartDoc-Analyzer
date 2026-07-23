from collections import Counter
from functools import lru_cache
from typing import Any

import spacy

from app.core.config import get_settings

settings = get_settings()

STOPWORD_POS = {"DET", "ADP", "PRON", "CCONJ", "SCONJ", "PUNCT", "SPACE", "AUX", "PART"}


@lru_cache
def get_nlp():
    return spacy.load(settings.SPACY_MODEL)


def extract_entities(doc) -> list[dict[str, Any]]:
    counter: Counter[tuple[str, str]] = Counter()
    for ent in doc.ents:
        counter[(ent.text.strip(), ent.label_)] += 1
    return [
        {"text": text, "label": label, "count": count}
        for (text, label), count in sorted(counter.items(), key=lambda kv: -kv[1])
    ]


def extract_keywords(doc, top_n: int = 10) -> list[dict[str, Any]]:
    counter: Counter[str] = Counter()
    for token in doc:
        if token.is_stop or token.is_punct or token.is_space:
            continue
        if token.pos_ in STOPWORD_POS:
            continue
        if len(token.text.strip()) < 3:
            continue
        counter[token.lemma_.lower()] += 1
    return [{"keyword": word, "count": count} for word, count in counter.most_common(top_n)]


def generate_summary(text: str, entities: list[dict[str, Any]], sentence_count: int) -> str:
    word_count = len(text.split())
    if not text.strip():
        return "No text could be extracted from this document."
    top_entities = ", ".join(f"{e['text']} ({e['label']})" for e in entities[:5]) or "none detected"
    return (
        f"Document contains approximately {word_count} words across {sentence_count} sentences. "
        f"Top entities identified: {top_entities}."
    )


def analyze_text(text: str) -> dict[str, Any]:
    nlp = get_nlp()
    doc = nlp(text[:1_000_000])

    entities = extract_entities(doc)
    keywords = extract_keywords(doc)
    sentences = list(doc.sents)
    entity_type_breakdown = Counter(e["label"] for e in entities)

    stats = {
        "word_count": len(text.split()),
        "character_count": len(text),
        "sentence_count": len(sentences),
        "entity_count": sum(e["count"] for e in entities),
        "unique_entity_count": len(entities),
        "entity_type_breakdown": dict(entity_type_breakdown),
        "top_keywords": keywords,
    }

    summary = generate_summary(text, entities, len(sentences))

    return {"entities": entities, "summary": summary, "stats": stats}
