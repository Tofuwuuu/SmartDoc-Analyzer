import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getApiErrorMessage, listDocuments, uploadDocument } from "../lib/api";
import { DocumentList } from "../components/DocumentList";
import { UploadDropzone } from "../components/UploadDropzone";
import type { DocumentSummary } from "../types";

export function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const document = await uploadDocument(file);
        navigate(`/documents/${document.id}`);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setIsUploading(false);
        refresh();
      }
    },
    [navigate, refresh]
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Analyze a document</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload a PDF or image to extract text, entities, and insights automatically.
      </p>

      <div className="mt-6">
        <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Your documents</h2>
      {isLoading ? (
        <p className="mt-6 text-sm text-slate-500">Loading documents...</p>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
