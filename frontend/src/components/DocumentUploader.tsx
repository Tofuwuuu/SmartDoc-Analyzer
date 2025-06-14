import React, { useContext, useState, useRef, DragEvent, ChangeEvent } from 'react';
import { DocumentContext } from '../context/DocumentContext';
import { ThemeContext } from '../context/ThemeContext';
import './DocumentUploader.css';

// API URL from environment or default
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.smartdocanalyzer.com' 
  : 'http://localhost:8000';

const DocumentUploader: React.FC = () => {
  const { setDocumentResult, setIsLoading, setError } = useContext(DocumentContext);
  const { theme } = useContext(ThemeContext);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('text_extraction');
  const [aiAnalysis, setAiAnalysis] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = (file: File) => {
    // Check if file is PDF or image
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or image file.');
      return;
    }

    setSelectedFile(file);
    setError(null);
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
      
      // Debug log
      console.log('Sending to API:', {
        file: selectedFile.name,
        analysis_type: analysisType,
        ai_analysis: aiAnalysis.toString()
      });

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

  const removeFile = () => {
    setSelectedFile(null);
    setAiAnalysis(true);
    setAnalysisType('text_extraction');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    <div className="uploader-container">
      <h2 className="uploader-title">Upload Document</h2>
      
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div className="drop-content">
            <div className="upload-icon-container">
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
              <div className="upload-progress-ring">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" />
                </svg>
              </div>
            </div>
            <p className="drop-text">
              <span className="primary-text">Drag & Drop your file here</span>
              <span className="secondary-text">or click to browse</span>
            </p>
            <p className="file-types">Supported formats: PDF, PNG, JPG, JPEG</p>
            <button 
              type="button" 
              className="browse-button" 
              onClick={onButtonClick}
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="selected-file">
            <div className="file-preview">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="file-icon" 
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
            </div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              type="button" 
              className="remove-file" 
              onClick={removeFile}
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
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="input-file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleChange}
        />
      </div>

      <div className="options-section">
        <div className="option-group">
          <label className="option-label">Analysis Type</label>
          <div className="option-controls">
            <button 
              className={`option-button ${analysisType === 'text_extraction' ? 'active' : ''}`}
              onClick={() => setAnalysisType('text_extraction')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="option-icon" 
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
              Text Extraction
            </button>
            <button 
              className={`option-button ${analysisType === 'ocr' ? 'active' : ''}`}
              onClick={() => setAnalysisType('ocr')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="option-icon" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                />
              </svg>
              OCR
            </button>
          </div>
        </div>
        
        <div className="ai-option">
          <label className="ai-checkbox">
            <input 
              type="checkbox" 
              checked={aiAnalysis} 
              onChange={(e) => setAiAnalysis(e.target.checked)} 
            />
            <span className="checkmark"></span>
            <span className="ai-label">Enable AI Analysis</span>
          </label>
          
          {aiAnalysis && (
            <div className="ai-features">
              <div className="feature-tag">Sentiment Analysis</div>
              <div className="feature-tag">Summarization</div>
              <div className="feature-tag">Classification</div>
              <div className="feature-tag">Entity Extraction</div>
            </div>
          )}
        </div>
      </div>

      <button 
        className={`process-button ${processing ? 'processing' : ''} ${!selectedFile ? 'disabled' : ''}`}
        onClick={handleUpload}
        disabled={!selectedFile || processing}
      >
        {processing ? (
          <>
            <svg className="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Processing Document
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
  );
};

export default DocumentUploader; 