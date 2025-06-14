import React from 'react';

interface ConfidenceMetricsProps {
  analysisType: string;
  metrics: {
    ocr_confidence?: number;
    extraction_accuracy?: number;
    processing_time?: number;
  };
}

const ConfidenceMetrics: React.FC<ConfidenceMetricsProps> = ({ 
  analysisType, 
  metrics
}) => {
  // Default values only if data is completely missing
  const ocrConfidence = metrics.ocr_confidence !== undefined ? metrics.ocr_confidence : 0;
  const extractionAccuracy = metrics.extraction_accuracy !== undefined ? metrics.extraction_accuracy : 0;
  const processingTime = metrics.processing_time !== undefined ? metrics.processing_time : 0;

  // Helper function to determine confidence level class
  const getConfidenceClass = (value: number): string => {
    if (value > 90) return 'high';
    if (value > 75) return 'medium';
    return 'low';
  };

  return (
    <div className="confidence-metrics-container">
      <h4 className="metrics-title">Extraction Metrics</h4>
      
      <div className="metrics-grid">
        {analysisType === 'ocr' && ocrConfidence !== undefined && (
          <div className="metric-item">
            <div className="metric-label">OCR Confidence</div>
            <div className="metric-value-container">
              <div className="metric-value">{ocrConfidence.toFixed(1)}%</div>
              <div className="confidence-bar-container">
                <div 
                  className={`confidence-bar ${getConfidenceClass(ocrConfidence)}`}
                  style={{ width: `${ocrConfidence}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {extractionAccuracy !== undefined && (
          <div className="metric-item">
            <div className="metric-label">Text Extraction Accuracy</div>
            <div className="metric-value-container">
              <div className="metric-value">{extractionAccuracy.toFixed(1)}%</div>
              <div className="confidence-bar-container">
                <div 
                  className={`confidence-bar ${getConfidenceClass(extractionAccuracy)}`}
                  style={{ width: `${extractionAccuracy}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        {processingTime !== undefined && (
          <div className="metric-item">
            <div className="metric-label">Processing Time</div>
            <div className="metric-value">{processingTime.toFixed(2)}s</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceMetrics; 