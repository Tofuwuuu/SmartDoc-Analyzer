import axios, { AxiosError } from "axios";

import type {
  DocumentListResponse,
  DocumentSummary,
  InsightResponse,
  TokenResponse,
} from "../types";
import { API_URL, usesBackend } from "./mode";

function assertBackend(): void {
  if (!usesBackend) {
    throw new Error("No API is configured. This build analyzes documents in the browser.");
  }
}

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartdoc_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return axiosError.response?.data?.detail ?? axiosError.message ?? "Request failed";
  }
  return "An unexpected error occurred";
}

export async function uploadDocument(file: File): Promise<DocumentSummary> {
  assertBackend();
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<DocumentSummary>("/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function listDocuments(): Promise<DocumentListResponse> {
  assertBackend();
  const { data } = await apiClient.get<DocumentListResponse>("/documents");
  return data;
}

export async function getDocument(id: string): Promise<DocumentSummary> {
  assertBackend();
  const { data } = await apiClient.get<DocumentSummary>(`/documents/${id}`);
  return data;
}

export async function getDocumentInsights(id: string): Promise<InsightResponse> {
  assertBackend();
  const { data } = await apiClient.get<InsightResponse>(`/documents/${id}/insights`);
  return data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  assertBackend();
  const { data } = await apiClient.post<TokenResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string): Promise<void> {
  assertBackend();
  await apiClient.post("/auth/register", { email, password });
}
