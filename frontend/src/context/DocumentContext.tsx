import React, { createContext, useState, ReactNode } from 'react';

export interface DocumentResult {
  filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  text_content: string;
  analysis_type: string;
  analysis_results?: Record<string, any>;
}

interface DocumentContextProps {
  documentResult: DocumentResult | null;
  isLoading: boolean;
  error: string | null;
  setDocumentResult: (result: DocumentResult | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const DocumentContext = createContext<DocumentContextProps>({
  documentResult: null,
  isLoading: false,
  error: null,
  setDocumentResult: () => {},
  setIsLoading: () => {},
  setError: () => {},
});

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  const [documentResult, setDocumentResult] = useState<DocumentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <DocumentContext.Provider
      value={{
        documentResult,
        isLoading,
        error,
        setDocumentResult,
        setIsLoading,
        setError,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}; 