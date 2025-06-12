import React from 'react';
import './App.css';
import Header from './components/Header';
import DocumentUploader from './components/DocumentUploader';
import ResultsDisplay from './components/ResultsDisplay';
import { DocumentProvider } from './context/DocumentContext';
import { ThemeProvider } from './context/ThemeContext';
import './components/visualizations/visualizations.css';

function App() {
  return (
    <ThemeProvider>
      <DocumentProvider>
        <div className="app-container">
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
        </div>
      </DocumentProvider>
    </ThemeProvider>
  );
}

export default App;
