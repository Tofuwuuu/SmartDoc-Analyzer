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

  const { classification, entities, sentiment, keywords } = insights;

  return (
    <div className="ai-insights">
      <div className="insight-section">
        <h4>Document Classification</h4>
        <div className="document-type">
          <span className="type-label">{classification?.type || 'Unknown'}</span>
          {classification?.confidence && (
            <span className="type-confidence"> ({classification.confidence})</span>
          )}
        </div>
      </div>

      <div className="insight-section">
        <h4>Extracted Entities</h4>
        {!entities || Object.keys(entities).length === 0 ? (
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
        {sentiment && (
          <div className={`sentiment-box ${sentiment.label?.toLowerCase() || 'neutral'}`}>
            <span className="sentiment-label">{sentiment.label || 'Neutral'}</span>
            <span className="sentiment-score">Score: {sentiment.score || '0.5'}</span>
          </div>
        )}
      </div>

      <div className="insight-section">
        <h4>Keywords</h4>
        {keywords && keywords.length > 0 ? (
          <div className="keywords-list">
            {keywords.map((keyword, index) => (
              <span key={index} className="keyword-item">{keyword}</span>
            ))}
          </div>
        ) : (
          <p>No keywords detected</p>
        )}
      </div>
    </div>
  );
};

export default AIInsights; 