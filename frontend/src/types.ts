export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentSummary {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  file_hash: string;
  status: DocumentStatus;
  extracted_text: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: DocumentSummary[];
  total: number;
}

export interface EntityItem {
  text: string;
  label: string;
  count: number;
}

export interface KeywordItem {
  keyword: string;
  count: number;
}

export interface InsightStats {
  word_count: number;
  character_count: number;
  sentence_count: number;
  entity_count: number;
  unique_entity_count: number;
  entity_type_breakdown: Record<string, number>;
  top_keywords: KeywordItem[];
}

export type RiskSeverity = "high" | "medium" | "low";

export interface RiskFlag {
  type: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  evidence: string | null;
}

export interface InsightResponse {
  id: string;
  document_id: string;
  entities: EntityItem[];
  summary: string;
  stats: InsightStats;
  document_type: string;
  risk_flags: RiskFlag[];
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
