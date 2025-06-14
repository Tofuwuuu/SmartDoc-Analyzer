import React, { useContext, useState } from 'react';
import { DocumentContext } from '../context/DocumentContext';
import { ThemeContext } from '../context/ThemeContext';
import FileInfoCard from './ui/FileInfoCard';
import EntityVisualization from './visualizations/EntityVisualization';
import DocumentStatistics from './visualizations/DocumentStatistics';
import ConfidenceMetrics from './visualizations/ConfidenceMetrics';
import SentimentVisualization from './visualizations/SentimentVisualization';
import EnhancedEntityVisualization from './visualizations/EnhancedEntityVisualization';
import AIInsights from './visualizations/AIInsights';
import './ResultsDisplay.css';

const ResultsDisplay: React.FC = () => {
  const { documentResult, isLoading, error } = useContext(DocumentContext);
  const { theme } = useContext(ThemeContext);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Function to copy text to clipboard
  const copyToClipboard = () => {
    if (!documentResult?.text_content) return;
    
    navigator.clipboard.writeText(documentResult.text_content)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  if (isLoading) {
    return (
      <div className="results-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3 className="loading-text">Processing Document...</h3>
          <p className="loading-subtext">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container">
        <div className="error-container">
          <div className="error-content">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="error-icon" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <h3 className="error-title">Error</h3>
              <p className="error-message">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!documentResult) {
    return (
      <div className="results-container">
        <div className="empty-container">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="empty-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="empty-title">No Document Processed</h3>
          <p className="empty-message">
            Upload a document to see the extracted text and analysis results here.
          </p>
        </div>
      </div>
    );
  }

  // Destructure AI analysis results if available
  const aiResults = documentResult.analysis_results || {};
  
  // Debug logging
  console.log('Document Result:', documentResult);
  console.log('AI Analysis Results:', aiResults);
  
  // Parse JSON strings if necessary
  const parseJsonIfString = (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Failed to parse JSON string:', e);
        return value;
      }
    }
    return value;
  };
  
  // Get parsed entities
  const sentiment = parseJsonIfString(aiResults.sentiment);
  const entities = parseJsonIfString(aiResults.entities);
  const summary = parseJsonIfString(aiResults.summary);
  const classification = parseJsonIfString(aiResults.classification);
  
  // Check if AI results are available
  const hasSentiment = !!sentiment;
  const hasSummary = !!summary && summary.summary;
  const hasClassification = !!classification;
  const hasEntities = !!entities && Object.keys(entities.entities || {}).length > 0;
  const hasAiResults = hasSentiment || hasSummary || hasClassification || hasEntities;

  // Get timestamp for the processed document if available
  const timestamp = documentResult.processed_at || new Date().toLocaleString();

  // Display document results
  return (
    <div className="results-display">
      <div className="results-header">
        <h2 className="results-title">Document Analysis Results</h2>
      </div>
      
      {/* File Information */}
      <FileInfoCard 
        filename={documentResult.filename}
        fileType={documentResult.analysis_type === 'ocr' ? 'OCR' : 'Text Extraction'}
        fileSize={documentResult.file_size}
        contentType={documentResult.content_type}
        timestamp={timestamp}
      />

      {/* AI Insights Panel - NEW COMPONENT */}
      {hasAiResults && (
        <AIInsights aiResults={aiResults} />
      )}

      {/* Extraction Confidence Metrics - NEW COMPONENT */}
      <ConfidenceMetrics 
        analysisType={documentResult.analysis_type} 
        metrics={{
          ocr_confidence: aiResults.confidence_metrics?.overall_confidence ? 
            aiResults.confidence_metrics.overall_confidence * 100 : 
            undefined,
          extraction_accuracy: aiResults.confidence_metrics?.character_confidence?.average ? 
            aiResults.confidence_metrics.character_confidence.average * 100 : 
            undefined,
          processing_time: aiResults.metrics?.processing_time || undefined
        }}
      />
      
      {/* Document Statistics */}
      <DocumentStatistics text={documentResult.text_content} />

      {/* AI Analysis Section */}
      {hasAiResults ? (
        <div className="ai-analysis-section">
          <h3 className="section-title">AI Analysis Results</h3>
          
          {/* Sentiment Analysis - ENHANCED */}
          {hasSentiment && (
            <div className="result-card">
              <div className="result-card-header">
                <h4 className="result-type">
                  <svg 
                    className="result-icon" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    {sentiment.label.toLowerCase() === 'positive' && (
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    )}
                    {sentiment.label.toLowerCase() === 'negative' && (
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    )}
                    {sentiment.label.toLowerCase() === 'neutral' && (
                      <path d="M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    )}
                    <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Sentiment Analysis
                </h4>
                <div className={`sentiment-badge ${sentiment.label.toLowerCase()}`}>
                  {sentiment.label}
                </div>
              </div>
              
              <p className="result-message">{sentiment.message || "Analysis of the document's emotional tone."}</p>
              
              {/* New Sentiment Visualization Component */}
              <SentimentVisualization sentiment={sentiment} />
            </div>
          )}
          
          {/* Document Classification */}
          {hasClassification && (
            <div className="result-card">
              <div className="result-card-header">
                <h4 className="result-type">
                  <svg
                    className="result-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-7.93a2 2 0 01-1.66-.9l-.82-1.2A2 2 0 008.93 3H4a2 2 0 00-2 2v13c0 1.1.9 2 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Document Classification
                </h4>
                <div className="classification-badge">
                  {classification.top_category}
                </div>
              </div>
              
              <p className="result-message">{classification.message || "Document type classification results."}</p>
              
              {classification.scores && (
                <div className="classification-scores">
                  <div className="classification-scores-list">
                    {Object.entries(classification.scores)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([category, score]) => (
                        <div key={category} className="classification-score-item">
                          <div className="classification-category-info">
                            <div className="classification-category">{category}</div>
                            <div className="classification-score-value">
                              {(Number(score) * 100).toFixed(0)}%
                            </div>
                          </div>
                          <div className="classification-score-bar-container">
                            <div 
                              className="classification-score-bar"
                              style={{width: `${Number(score) * 100}%`}}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Text Summarization */}
          {hasSummary && (
            <div className="result-card">
              <div className="result-card-header">
                <h4 className="result-type">
                  <svg
                    className="result-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 9h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 17h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Document Summary
                </h4>
              </div>
              
              <p className="result-message">{summary.message || "Automated summary of the document content."}</p>
              
              <div className="summary-container">
                <div className="summary-content">
                  {summary.summary}
                </div>
                
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="summary-stat-label">Original:</span>
                    <span className="summary-stat-value">{summary.original_length} chars</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-label">Summary:</span>
                    <span className="summary-stat-value">{summary.summary_length} chars</span>
                  </div>
                  <div className="summary-stat summary-reduction">
                    <span className="summary-stat-label">Reduction:</span>
                    <span className="summary-stat-value">
                      {Math.round((1 - summary.summary_length / summary.original_length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Named Entity Recognition - ENHANCED */}
          {hasEntities && (
            <div className="result-card">
              <div className="result-card-header">
                <h4 className="result-type">
                  <svg
                    className="result-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 7a4 4 0 100-8 4 4 0 000 8z" transform="translate(0 3)" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Entity Extraction
                </h4>
              </div>
              
              <p className="result-message">{entities.message || "Identification of key entities in the document."}</p>
              
              {/* Enhanced Entity Visualization - NEW COMPONENT */}
              <EnhancedEntityVisualization entities={entities} />
              
              {/* Original Entity Visualization */}
              <h4 className="visualization-subtitle">Entity Highlighting</h4>
              <EntityVisualization text={documentResult.text_content} entities={entities} />
            </div>
          )}
        </div>
      ) : (
        <div className="no-ai-results">
          <div className="notification-card">
            <svg className="notification-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16h-2v-6h2v6zm0-8h-2v-2h2v2zm-1-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
                fill="currentColor" />
            </svg>
            <div className="notification-content">
              <h4 className="notification-title">No AI Analysis Results</h4>
              <p className="notification-message">
                Enable the "AI Analysis" checkbox when uploading documents to see:
              </p>
              <ul className="feature-list">
                <li>Sentiment analysis (positive/negative/neutral rating)</li>
                <li>Entity recognition (names, organizations, dates)</li>
                <li>Document classification (thesis, report, contract, etc.)</li>
                <li>Text summarization and keyword extraction</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Text Section */}
      <div className="content-section">
        <h3 className="section-title">
          <svg
            className="section-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Extracted Text
        </h3>
        
        <div className="text-content-container">
          <div className="text-content-controls">
            <button 
              className="text-content-control-button copy-button"
              onClick={copyToClipboard}
              title="Copy text to clipboard"
            >
              {copySuccess ? (
                <>
                  <svg
                    className="control-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="control-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copy Text
                </>
              )}
            </button>
          </div>
          
          <div className="text-content">
            <pre className="extracted-text">
              {documentResult.text_content || 'No text content extracted.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay; 