import React from 'react';

interface AIInsightsProps {
  aiResults: {
    classification?: {
      top_category: string;
      confidence: number;
    };
    sentiment?: {
      label: string;
      score: number;
      distribution?: {
        positive: number;
        neutral: number;
        negative: number;
      };
    };
    summary?: {
      summary: string;
    };
    entities?: {
      entities: Record<string, string[]>;
      positions?: Array<{
        text: string;
        type: string;
        start: number;
        end: number;
      }>;
    };
    keywords?: Record<string, number>;
  };
}

interface EntityTypeData {
  values: string[];
  freq: number;
}

interface EntityPosition {
  text: string;
  type: string;
  start: number;
  end: number;
}

const AIInsights: React.FC<AIInsightsProps> = ({ 
  aiResults 
}) => {
  // Parse JSON strings if necessary
  const parseJsonIfString = <T extends unknown>(value: any): T => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch (e) {
        console.error('Failed to parse JSON string:', e);
        return value as T;
      }
    }
    return value as T;
  };
  
  // Parse potential JSON strings
  const classification = parseJsonIfString<AIInsightsProps['aiResults']['classification']>(aiResults?.classification);
  const sentiment = parseJsonIfString<AIInsightsProps['aiResults']['sentiment']>(aiResults?.sentiment);
  const entities = parseJsonIfString<AIInsightsProps['aiResults']['entities']>(aiResults?.entities);
  const keywords = parseJsonIfString<Record<string, number>>(aiResults?.keywords);
  
  // Use data from the backend or fallback to empty values
  const docType = classification?.top_category || 'Not classified';
  const docConfidence = classification?.confidence || 0;
  const sentimentValue = sentiment?.score || 0;
  const sentimentLabel = sentiment?.label || 'NEUTRAL';
  
  // Process entities from backend data
  const entityTypes: Record<string, EntityTypeData> = {};
  
  if (entities?.entities) {
    Object.entries(entities.entities).forEach(([type, values]) => {
      // Count occurrences of each entity in the positions array
      const entityFrequencies: Record<string, number> = {};
      
      if (entities.positions) {
        entities.positions.forEach((pos: EntityPosition) => {
          if (pos.type === type) {
            entityFrequencies[pos.text] = (entityFrequencies[pos.text] || 0) + 1;
          }
        });
      }
      
      // Calculate total frequency for this entity type
      const totalFreq = Object.values(entityFrequencies).reduce((sum, freq) => sum + freq, 0) || (values as string[]).length;
      
      entityTypes[type] = {
        values: (values as string[]).slice(0, 2), // Take only first two values for display
        freq: totalFreq
      };
    });
  }

  // Distribution for sentiment
  const distribution = sentiment?.distribution || {
    positive: 0,
    neutral: 1,
    negative: 0
  };

  // Keywords for the cloud (from backend or calculated from entities)
  const keywordsList = keywords ? 
    Object.keys(keywords).sort((a, b) => keywords[b] - keywords[a]).slice(0, 4) : 
    Object.values(entityTypes).flatMap(type => type.values).slice(0, 4);
  
  return (
    <div className="ai-insights-panel">
      <h3 className="panel-title">AI Insights</h3>
      
      <div className="insights-grid">
        {classification && (
          <div className="insight-card document-type-card">
            <div className="insight-header">
              <h4>Document Classification</h4>
              <div className="confidence-badge">
                {Math.round(docConfidence * 100)}% confidence
              </div>
            </div>
            <div className="document-type">{docType}</div>
          </div>
        )}
        
        {sentiment && (
          <div className="insight-card sentiment-card">
            <h4>Overall Sentiment</h4>
            <div className={`sentiment-value ${sentimentLabel.toLowerCase()}`}>
              {sentimentLabel} ({sentimentValue.toFixed(2)})
            </div>
            <div className="sentiment-gauge-mini">
              <div 
                className="sentiment-gauge-fill" 
                style={{ 
                  width: `${sentimentValue * 100}%`,
                  backgroundColor: sentimentLabel === 'POSITIVE' ? '#4caf50' : 
                                  sentimentLabel === 'NEGATIVE' ? '#f44336' : '#ffeb3b'
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      {Object.keys(entityTypes).length > 0 && (
        <div className="key-entities-section">
          <h4>Key Entities</h4>
          <table className="key-entities-table">
            <thead>
              <tr>
                <th>TYPE</th>
                <th>VALUES</th>
                <th>FREQ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(entityTypes).map(([type, data]) => (
                <tr key={type}>
                  <td className="entity-type">{type}</td>
                  <td className="entity-values">
                    {data.values.join(', ')}
                  </td>
                  <td className="entity-freq">
                    {data.freq}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {(keywordsList.length > 0 || Object.keys(distribution).length > 0) && (
        <div className="visual-analytics-section">
          <h4>Visual Analytics</h4>
          <div className="analytics-grid">
            {keywordsList.length > 0 && (
              <div className="keyword-cloud-container">
                <div className="analytics-label">▨ Keyword Cloud:</div>
                <div className="keyword-cloud">
                  {keywordsList.map((word, index) => (
                    <span key={index} className="keyword-tag">[{word}]</span>
                  ))}
                </div>
              </div>
            )}
            
            {Object.keys(distribution).length > 0 && (
              <div className="sentiment-distribution-container">
                <div className="analytics-label">█ Sentiment Distribution:</div>
                <div className="mini-distribution">
                  <span className="dist-item positive">
                    Positive {Math.round(distribution.positive * 100)}% 
                    <span className="dist-bar" style={{width: `${Math.round(distribution.positive * 100)}px`, maxWidth: '100px'}}>██</span>
                  </span>
                  <span className="dist-item neutral">
                    Neutral {Math.round(distribution.neutral * 100)}% 
                    <span className="dist-bar" style={{width: `${Math.round(distribution.neutral * 100)}px`, maxWidth: '100px'}}>█</span>
                  </span>
                  <span className="dist-item negative">
                    Negative {Math.round(distribution.negative * 100)}% 
                    <span className="dist-bar" style={{width: `${Math.round(distribution.negative * 100)}px`, maxWidth: '100px'}}>█</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights; 