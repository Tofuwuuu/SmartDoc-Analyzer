import React from 'react';
import StatsCard from './StatsCard';
import AIInsights from './AIInsights';
import './ResultsPanel.css';

const ResultsPanel = ({ documentData }) => {
  if (!documentData) return null;

  const {
    file_name,
    file_type,
    file_size,
    processing_time,
    ocr_confidence,
    extraction_accuracy,
    stats,
    top_words,
    ai_insights,
    text
  } = documentData;

  // Format top_words to handle different possible formats
  const formattedTopWords = Array.isArray(top_words) 
    ? top_words.map(word => Array.isArray(word) ? word : [word, ''])
    : [];

  return (
    <div className="results-panel">
      <h2>Document Analysis Results</h2>
      
      <div className="file-info">
        <h3>File Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">File Name:</span>
            <span className="value">{file_name || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">File Type:</span>
            <span className="value">{file_type || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">File Size:</span>
            <span className="value">{file_size || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">Processing Time:</span>
            <span className="value">{processing_time || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <span className="label">OCR Confidence:</span>
            <span className="value">{ocr_confidence || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Extraction Accuracy:</span>
            <span className="value">{extraction_accuracy || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <h3>Document Statistics</h3>
        <div className="stats-cards">
          <StatsCard title="Characters" value={stats?.characters || 0} />
          <StatsCard title="Words" value={stats?.words || 0} />
          <StatsCard title="Sentences" value={stats?.sentences || 0} />
          <StatsCard title="Paragraphs" value={stats?.paragraphs || 0} />
        </div>
      </div>

      {formattedTopWords.length > 0 && (
        <div className="top-words-section">
          <h3>Top Words</h3>
          <ul className="top-words-list">
            {formattedTopWords.map((word, index) => (
              <li key={index} className="word-item">
                <span className="word">{word[0]}</span>
                {word[1] && <span className="count">{word[1]}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ai-insights-section">
        <h3>AI Insights</h3>
        <AIInsights insights={ai_insights || {}} />
      </div>

      {text && (
        <div className="extracted-text-section">
          <h3>Extracted Text</h3>
          <div className="extracted-text">
            <p>{text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel; 