import React, { useContext, useState, useRef } from 'react';
import { DocumentContext } from '../context/DocumentContext';
import { ThemeContext } from '../context/ThemeContext';
import './DocumentUploader.css';

const API_URL = 'http://localhost:8000';

const DocumentUploader: React.FC = () => {
  const { setDocumentResult, setIsLoading, setError } = useContext(DocumentContext);
  const { theme } = useContext(ThemeContext);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('text_extraction');
  const [aiAnalysis, setAiAnalysis] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  const handleFileSelection = (file: File) => {
    // Check if file is PDF or image
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or image file.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setIsLoading(true);
    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('analysis_type', analysisType);
      formData.append('ai_analysis', aiAnalysis.toString());

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setDocumentResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };

  // Reset everything and allow uploading a new file
  const handleReset = () => {
    setSelectedFile(null);
    setAiAnalysis(false);
    setAnalysisType('text_extraction');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to get file icon based on type
  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    const fileType = selectedFile.type;
    
    if (fileType === 'application/pdf') {
      return (
        <svg className="file-type-icon pdf" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 14H14V20H20V14Z" fill="#FF5252" />
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    if (fileType.startsWith('image/')) {
      return (
        <svg className="file-type-icon image" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M6 20L18 10L20 12V18C20 19.1046 19.1046 20 18 20H6Z" fill="#4CAF50" />
        </svg>
      );
    }
    
    return (
      <svg className="file-type-icon default" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className="document-uploader">
      <h2 className="uploader-title">Upload Document</h2>
      
      {!selectedFile ? (
        <div 
          className={`drop-area ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            className="file-input"
          />
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="upload-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          
          <p className="drop-text">
            <span className="drop-title">Upload your document</span>
            Drag & drop your document here or <span className="browse-text">browse</span>
          </p>
          <p className="file-types">Supports PDF, JPG, PNG and TIFF files</p>
        </div>
      ) : (
        <div className="selected-file-container">
          <div className="selected-file">
            <div className="file-icon-container">{getFileIcon()}</div>
            <div className="file-details">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={handleReset}
              className="btn-icon remove-file"
              aria-label="Remove file"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="remove-icon" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          
          <div className="analysis-options">
            <div className="analysis-type-container">
              <label className="analysis-label">Analysis Type</label>
              <div className="analysis-types">
                <button 
                  className={`analysis-option ${analysisType === 'text_extraction' ? 'active' : ''}`}
                  onClick={() => setAnalysisType('text_extraction')}
                >
                  <svg className="analysis-option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 13H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 17H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Text Extraction</span>
                </button>
                
                <button 
                  className={`analysis-option ${analysisType === 'ocr' ? 'active' : ''}`}
                  onClick={() => setAnalysisType('ocr')}
                >
                  <svg className="analysis-option-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3L2 8L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 21L22 16L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 8H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 16H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>OCR</span>
                </button>
              </div>
            </div>
            
            <div className="ai-analysis-container">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={aiAnalysis}
                  onChange={(e) => setAiAnalysis(e.target.checked)}
                />
                <span className="checkbox-label">Enable AI Analysis</span>
              </label>
              
              {aiAnalysis && (
                <div className="ai-features">
                  <div className="feature-badges">
                    <span className="feature-badge">Sentiment Analysis</span>
                    <span className="feature-badge">Summarization</span>
                    <span className="feature-badge">Classification</span>
                    <span className="feature-badge">Entity Extraction</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || processing}
            className={`process-button ${!selectedFile || processing ? 'disabled' : ''}`}
          >
            {processing ? (
              <>
                <div className="button-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="process-icon" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Process Document
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader; 