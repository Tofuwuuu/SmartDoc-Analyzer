import React from 'react';

interface SentimentVisualizationProps {
  sentiment: {
    label: string;
    score: number;
    distribution?: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
}

const SentimentVisualization: React.FC<SentimentVisualizationProps> = ({ 
  sentiment 
}) => {
  // Default distribution if not provided
  const distribution = sentiment.distribution || {
    positive: sentiment.label === 'POSITIVE' ? 0.54 : 0.23,
    neutral: sentiment.label === 'NEUTRAL' ? 0.54 : 0.54,
    negative: sentiment.label === 'NEGATIVE' ? 0.54 : 0.15
  };
  
  return (
    <div className="sentiment-visualization">
      <h4 className="visualization-title">Sentiment Distribution</h4>
      
      <div className="sentiment-distribution">
        <div className="distribution-item">
          <div className="distribution-label">
            <span className="sentiment-indicator positive"></span>
            Positive
          </div>
          <div className="distribution-bar-container">
            <div 
              className="distribution-bar positive"
              style={{ width: `${distribution.positive * 100}%` }}
            ></div>
            <span className="distribution-value">{Math.round(distribution.positive * 100)}%</span>
          </div>
        </div>
        
        <div className="distribution-item">
          <div className="distribution-label">
            <span className="sentiment-indicator neutral"></span>
            Neutral
          </div>
          <div className="distribution-bar-container">
            <div 
              className="distribution-bar neutral"
              style={{ width: `${distribution.neutral * 100}%` }}
            ></div>
            <span className="distribution-value">{Math.round(distribution.neutral * 100)}%</span>
          </div>
        </div>
        
        <div className="distribution-item">
          <div className="distribution-label">
            <span className="sentiment-indicator negative"></span>
            Negative
          </div>
          <div className="distribution-bar-container">
            <div 
              className="distribution-bar negative"
              style={{ width: `${distribution.negative * 100}%` }}
            ></div>
            <span className="distribution-value">{Math.round(distribution.negative * 100)}%</span>
          </div>
        </div>
      </div>
      
      <div className="sentiment-score-container">
        <div className="sentiment-score">
          <div className="score-label">Overall Sentiment Score</div>
          <div className="score-value">{sentiment.score.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default SentimentVisualization; 