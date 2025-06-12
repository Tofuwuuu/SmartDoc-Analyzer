import React from 'react';

interface DocumentStatisticsProps {
  text: string;
}

const DocumentStatistics: React.FC<DocumentStatisticsProps> = ({ text }) => {
  // Calculate various text statistics
  const stats = {
    characters: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    paragraphs: text.split(/\n\s*\n/).filter(Boolean).length,
    lines: text.split('\n').length,
    sentences: text.split(/[.!?]+/).filter(Boolean).length
  };

  // Top 5 most common words
  const getTopWords = () => {
    if (!text.trim()) return [];

    // Remove common stop words for better analysis
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 
      'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 
      'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'
    ]);

    // Extract words, convert to lowercase and remove punctuation
    const words = text.toLowerCase()
      .replace(/[^\w\s]|_/g, '')
      .split(/\s+/)
      .filter(word => word && word.length > 2 && !stopWords.has(word));

    // Count occurrences
    const wordCount = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    // Sort by count and get top 5
    return Object.entries(wordCount)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5);
  };

  const topWords = getTopWords();

  // Calculate the max count for scaling bar widths
  const maxCount = topWords.length > 0 
    ? Math.max(...topWords.map(([, count]) => count as number)) 
    : 0;

  return (
    <div className="document-statistics-container">
      <h3 className="section-title">Document Statistics</h3>
      
      <div className="document-statistics">
        <div className="statistic-card">
          <div className="statistic-value">{stats.characters}</div>
          <div className="statistic-label">Characters</div>
        </div>
        
        <div className="statistic-card">
          <div className="statistic-value">{stats.words}</div>
          <div className="statistic-label">Words</div>
        </div>
        
        <div className="statistic-card">
          <div className="statistic-value">{stats.sentences}</div>
          <div className="statistic-label">Sentences</div>
        </div>
        
        <div className="statistic-card">
          <div className="statistic-value">{stats.paragraphs}</div>
          <div className="statistic-label">Paragraphs</div>
        </div>
      </div>
      
      {topWords.length > 0 && (
        <div className="top-words-section">
          <h4 className="subsection-title">Top Words</h4>
          <div className="top-words-container">
            {topWords.map(([word, count], index) => {
              const percentage = maxCount ? (count as number) / maxCount * 100 : 0;
              
              return (
                <div key={word} className="top-word-item">
                  <div className="top-word-rank">
                    <span className="rank-number">{index + 1}</span>
                  </div>
                  <div className="top-word-details">
                    <div className="top-word-header">
                      <span className="top-word-text">{word}</span>
                      <span className="top-word-count">{count}</span>
                    </div>
                    <div className="top-word-bar-container">
                      <div 
                        className="top-word-bar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentStatistics; 