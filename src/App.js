import React, { useState } from 'react';
import UploadArea from './components/UploadArea';
import ResultsPanel from './components/ResultsPanel';
import './App.css';

function App() {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDocumentProcessed = (data) => {
    setDocumentData(data);
    setLoading(false);
  };

  const handleProcessingStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleError = (err) => {
    setError(err.message || 'An error occurred during document processing');
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SmartDoc Analyzer</h1>
        <p>Upload and analyze documents with AI</p>
      </header>

      <main className="app-main">
        <UploadArea 
          onProcessingStart={handleProcessingStart}
          onDocumentProcessed={handleDocumentProcessed}
          onError={handleError}
        />

        {loading && (
          <div className="loading-indicator">
            <p>Processing document...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {documentData && !loading && (
          <ResultsPanel documentData={documentData} />
        )}
      </main>

      <footer className="app-footer">
        <p>&copy; 2023 SmartDoc Analyzer</p>
      </footer>
    </div>
  );
}

export default App; 