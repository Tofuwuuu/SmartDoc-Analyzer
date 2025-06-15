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
    ai_insights
  } = documentData;

  return (
    <div className="results-panel">
      <h2>Document Analysis Results</h2>
      
      <div className="file-info">
        <h3>File Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">File Name:</span>
            <span className="value">{file_name}</span>
          </div>
          <div className="info-item">
            <span className="label">File Type:</span>
            <span className="value">{file_type}</span>
          </div>
          <div className="info-item">
            <span className="label">File Size:</span>
            <span className="value">{file_size}</span>
          </div>
          <div className="info-item">
            <span className="label">Processing Time:</span>
            <span className="value">{processing_time}</span>
          </div>
          <div className="info-item">
            <span className="label">OCR Confidence:</span>
            <span className="value">{ocr_confidence}</span>
          </div>
          <div className="info-item">
            <span className="label">Extraction Accuracy:</span>
            <span className="value">{extraction_accuracy}</span>
          </div>
        </div>
      </div>

      <div className="statistics-section">
        <h3>Document Statistics</h3>
        <div className="stats-cards">
          <StatsCard title="Characters" value={stats.characters} />
          <StatsCard title="Words" value={stats.words} />
          <StatsCard title="Sentences" value={stats.sentences} />
          <StatsCard title="Paragraphs" value={stats.paragraphs} />
        </div>
      </div>

      <div className="top-words-section">
        <h3>Top Words</h3>
        <ul className="top-words-list">
          {top_words.map((word, index) => (
            <li key={index} className="word-item">
              <span className="word">{word[0]}</span>
              <span className="count">{word[1]}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="ai-insights-section">
        <h3>AI Insights</h3>
        <AIInsights insights={ai_insights} />
      </div>
    </div>
  );
};

export default ResultsPanel; 