import nlp from "compromise";

import type { EntityItem, InsightStats, KeywordItem } from "../types";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "been",
  "have",
  "has",
  "had",
  "not",
  "but",
  "its",
  "their",
  "they",
  "you",
  "your",
  "our",
  "shall",
  "may",
  "each",
  "either",
  "into",
  "over",
  "under",
  "than",
  "then",
  "such",
  "any",
  "all",
  "per",
  "via",
  "hereby",
  "herein",
  "hereof",
  "whereas",
  "unto",
  "upon",
  "within",
  "without",
  "between",
  "among",
  "after",
  "before",
  "about",
  "other",
  "also",
  "only",
  "same",
  "said",
]);

export interface TextAnalysis {
  entities: EntityItem[];
  summary: string;
  stats: InsightStats;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function cleanEntity(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s"'([{]+/, "")
    .replace(/[\s"'.,;:)\]}]+$/g, "")
    .trim();
}

function collect(items: string[], label: string, counts: Map<string, EntityItem>): void {
  for (const raw of items) {
    const text = cleanEntity(raw);
    if (text.length < 3) continue;
    const key = `${label}::${text.toLowerCase()}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { text, label, count: 1 });
    }
  }
}

function extractEntities(text: string): EntityItem[] {
  const doc = nlp(text);
  const counts = new Map<string, EntityItem>();
  collect(doc.people().out("array"), "PERSON", counts);
  collect(doc.organizations().out("array"), "ORG", counts);
  collect(doc.places().out("array"), "PLACE", counts);
  return [...counts.values()].sort((left, right) => right.count - left.count || left.text.localeCompare(right.text));
}

function extractKeywords(text: string, topN = 10): KeywordItem[] {
  const terms = nlp(text).match("#Noun").not("#Pronoun").out("array") as string[];
  const counts = new Map<string, number>();
  for (const term of terms) {
    const keyword = term.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (keyword.length < 3 || STOPWORDS.has(keyword)) continue;
    counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, topN)
    .map(([keyword, count]) => ({ keyword, count }));
}

function sentenceCount(text: string): number {
  if (!text.trim()) return 0;
  const counted = nlp(text).sentences().length;
  return counted > 0 ? counted : 1;
}

function overview(text: string, entities: EntityItem[], sentences: number): string {
  if (!text.trim()) return "No text could be extracted from this document.";
  const top = entities.slice(0, 5).map((entity) => `${entity.text} (${entity.label})`).join(", ") || "none detected";
  return (
    `Document contains approximately ${wordCount(text)} words across ${sentences} sentences. ` +
    `Top entities identified: ${top}.`
  );
}

export function analyzeText(text: string): TextAnalysis {
  const bounded = text.slice(0, 1_000_000);
  const entities = extractEntities(bounded);
  const keywords = extractKeywords(bounded);
  const sentences = sentenceCount(bounded);
  const entityTypeBreakdown: Record<string, number> = {};
  for (const entity of entities) {
    entityTypeBreakdown[entity.label] = (entityTypeBreakdown[entity.label] ?? 0) + 1;
  }
  return {
    entities,
    summary: overview(bounded, entities, sentences),
    stats: {
      word_count: wordCount(bounded),
      character_count: bounded.length,
      sentence_count: sentences,
      entity_count: entities.reduce((sum, entity) => sum + entity.count, 0),
      unique_entity_count: entities.length,
      entity_type_breakdown: entityTypeBreakdown,
      top_keywords: keywords,
    },
  };
}
