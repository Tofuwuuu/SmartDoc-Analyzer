import React from 'react';
import './AIInsights.css';

const AIInsights = ({ insights }) => {
  if (!insights || Object.keys(insights).length === 0) {
    return (
      <div className="ai-insights-empty">
        <p>No AI insights available for this document.</p>
      </div>
    );
  }

  const { document_type, entities, sentiment, summary } = insights;

  return (
    <div className="ai-insights">
      <div className="insight-section">
        <h4>Document Classification</h4>
        <div className="document-type">
          <span className="type-label">{document_type}</span>
        </div>
      </div>

      <div className="insight-section">
        <h4>Extracted Entities</h4>
        {Object.keys(entities).length === 0 ? (
          <p>No entities detected</p>
        ) : (
          <div className="entities-list">
            {Object.entries(entities).map(([entityType, items]) => (
              items.length > 0 && (
                <div key={entityType} className="entity-group">
                  <h5 className="entity-type">{entityType.replace('_', ' ').toUpperCase()}</h5>
                  <ul className="entity-items">
                    {items.map((item, index) => (
                      <li key={index} className="entity-item">{item}</li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      <div className="insight-section">
        <h4>Sentiment Analysis</h4>
        <div className={`sentiment-box ${sentiment.label.toLowerCase()}`}>
          <span className="sentiment-label">{sentiment.label}</span>
          <span className="sentiment-score">Score: {sentiment.score}</span>
        </div>
      </div>

      <div className="insight-section">
        <h4>Document Summary</h4>
        <div className="summary-text">
          <p>{summary}</p>
        </div>
      </div>
    </div>
  );
};

export default AIInsights; 