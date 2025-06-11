import React from 'react';
import './App.css';
import Header from './components/Header';
import DocumentUploader from './components/DocumentUploader';
import ResultsDisplay from './components/ResultsDisplay';
import { DocumentProvider } from './context/DocumentContext';

function App() {
  return (
    <div className="app-container">
      <DocumentProvider>
        <Header />
        <main className="main-content">
          <div className="content-grid">
            <div className="uploader-container">
              <DocumentUploader />
            </div>
            <div className="results-container">
              <ResultsDisplay />
            </div>
          </div>
        </main>
        <footer className="footer">
          <div className="footer-content">
            <p>SmartDoc Analyzer - Document Intelligence Platform</p>
          </div>
        </footer>
      </DocumentProvider>
    </div>
  );
}

export default App;
