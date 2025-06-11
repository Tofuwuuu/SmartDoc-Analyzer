import React, { useContext } from 'react';
import { DocumentContext } from '../context/DocumentContext';
import './ResultsDisplay.css';

const ResultsDisplay: React.FC = () => {
  const { documentResult, isLoading, error } = useContext(DocumentContext);

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
  const hasSentiment = aiResults.sentiment;
  const hasSummary = aiResults.summary && aiResults.summary.summary;
  const hasClassification = aiResults.classification;
  const hasEntities = aiResults.entities && Object.keys(aiResults.entities.entities || {}).length > 0;
  const hasAiResults = hasSentiment || hasSummary || hasClassification || hasEntities;

  // Display document results
  return (
    <div className="results-container">
      <div className="results-header">
        <h2 className="results-title">Document Analysis Results</h2>
        <div className="file-info">
          <span className="info-label">File:</span>
          <span className="info-value">{documentResult.filename}</span>
          <span className="info-separator">•</span>
          <span className="info-label">Size:</span>
          <span className="info-value">{(documentResult.file_size / 1024 / 1024).toFixed(2)} MB</span>
          <span className="info-separator">•</span>
          <span className="info-label">Type:</span>
          <span className="info-value">{documentResult.analysis_type === 'ocr' ? 'OCR' : 'Text Extraction'}</span>
        </div>
      </div>

      {/* AI Analysis Section */}
      {hasAiResults && (
        <div className="ai-analysis-section">
          <h3 className="ai-analysis-title">AI Analysis Results</h3>
          
          {/* Sentiment Analysis */}
          {hasSentiment && (
            <div className="ai-result-card">
              <div className="ai-result-header">
                <h4 className="ai-result-type">Sentiment Analysis</h4>
                <div className={`sentiment-badge ${aiResults.sentiment.label.toLowerCase()}`}>
                  {aiResults.sentiment.label}
                </div>
              </div>
              <p className="ai-result-message">{aiResults.sentiment.message}</p>
              <div className="sentiment-bar-container">
                <div 
                  className="sentiment-bar" 
                  style={{width: `${aiResults.sentiment.score * 100}%`}}
                />
              </div>
            </div>
          )}
          
          {/* Document Classification */}
          {hasClassification && (
            <div className="ai-result-card">
              <div className="ai-result-header">
                <h4 className="ai-result-type">Document Classification</h4>
              </div>
              <div className="classification-result">
                <div className="classification-main">
                  <span className="classification-label">Type:</span>
                  <span className="classification-value">{aiResults.classification.top_category}</span>
                </div>
                <p className="ai-result-message">{aiResults.classification.message}</p>
                
                {aiResults.classification.scores && (
                  <div className="classification-scores">
                    <h5 className="classification-scores-title">Categories:</h5>
                    <div className="classification-scores-list">
                      {Object.entries(aiResults.classification.scores)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([category, score]) => (
                          <div key={category} className="classification-score-item">
                            <span className="classification-category">{category}:</span>
                            <div className="classification-score-bar-container">
                              <div 
                                className="classification-score-bar" 
                                style={{width: `${Number(score) * 100}%`}}
                              />
                              <span className="classification-score-value">
                                {(Number(score) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Named Entity Recognition */}
          {hasEntities && (
            <div className="ai-result-card">
              <div className="ai-result-header">
                <h4 className="ai-result-type">Entity Extraction</h4>
              </div>
              <p className="ai-result-message">{aiResults.entities.message}</p>
              
              <div className="entities-container">
                {aiResults.entities.people && aiResults.entities.people.length > 0 && (
                  <div className="entity-group">
                    <h5 className="entity-group-title">People:</h5>
                    <div className="entity-tags">
                      {aiResults.entities.people.slice(0, 10).map((person: string, index: number) => (
                        <span key={index} className="entity-tag person-tag">{person}</span>
                      ))}
                      {aiResults.entities.people.length > 10 && (
                        <span className="entity-more">+{aiResults.entities.people.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                {aiResults.entities.organizations && aiResults.entities.organizations.length > 0 && (
                  <div className="entity-group">
                    <h5 className="entity-group-title">Organizations:</h5>
                    <div className="entity-tags">
                      {aiResults.entities.organizations.slice(0, 10).map((org: string, index: number) => (
                        <span key={index} className="entity-tag org-tag">{org}</span>
                      ))}
                      {aiResults.entities.organizations.length > 10 && (
                        <span className="entity-more">+{aiResults.entities.organizations.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                {aiResults.entities.locations && aiResults.entities.locations.length > 0 && (
                  <div className="entity-group">
                    <h5 className="entity-group-title">Locations:</h5>
                    <div className="entity-tags">
                      {aiResults.entities.locations.slice(0, 10).map((location: string, index: number) => (
                        <span key={index} className="entity-tag location-tag">{location}</span>
                      ))}
                      {aiResults.entities.locations.length > 10 && (
                        <span className="entity-more">+{aiResults.entities.locations.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Text Summarization */}
          {hasSummary && (
            <div className="ai-result-card">
              <div className="ai-result-header">
                <h4 className="ai-result-type">Document Summary</h4>
              </div>
              <p className="ai-result-message">{aiResults.summary.message}</p>
              <div className="summary-container">
                <p className="summary-text">{aiResults.summary.summary}</p>
                <div className="summary-stats">
                  <span className="summary-stat">
                    <span className="summary-stat-label">Original:</span>
                    <span className="summary-stat-value">{aiResults.summary.original_length} chars</span>
                  </span>
                  <span className="summary-stat">
                    <span className="summary-stat-label">Summary:</span>
                    <span className="summary-stat-value">{aiResults.summary.summary_length} chars</span>
                  </span>
                  <span className="summary-stat">
                    <span className="summary-stat-label">Reduction:</span>
                    <span className="summary-stat-value">
                      {Math.round((1 - aiResults.summary.summary_length / aiResults.summary.original_length) * 100)}%
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Text Section */}
      <div className="content-section">
        <h3 className="section-title">Extracted Text</h3>
        <div className="text-content">
          <pre className="extracted-text">
            {documentResult.text_content || 'No text content extracted.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay; 