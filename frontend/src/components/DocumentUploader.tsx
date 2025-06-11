import React, { useContext, useState, useRef } from 'react';
import { DocumentContext } from '../context/DocumentContext';
import './DocumentUploader.css';

const API_URL = 'http://localhost:8000';

const DocumentUploader: React.FC = () => {
  const { setDocumentResult, setIsLoading, setError } = useContext(DocumentContext);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<string>('text_extraction');
  const [aiAnalysis, setAiAnalysis] = useState<boolean>(false);
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
    }
  };

  return (
    <div className="uploader">
      <h2 className="uploader-title">Upload Document</h2>
      
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
          Drag & drop your document here or <span className="browse-text">browse</span>
        </p>
        <p className="file-types">Supports PDF, JPG, PNG and TIFF files</p>
      </div>
      
      {selectedFile && (
        <div className="selected-file">
          <p className="file-name">
            <span className="file-label">Selected file: </span> 
            {selectedFile.name}
          </p>
          <p className="file-size">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
      
      <div className="analysis-type-container">
        <label className="analysis-label">
          Analysis Type
        </label>
        <select 
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="analysis-select"
        >
          <option value="text_extraction">Text Extraction</option>
          <option value="ocr">OCR (Optical Character Recognition)</option>
        </select>
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
            <p className="ai-features-text">
              AI features include: sentiment analysis, summarization, classification, and entity extraction
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={handleUpload}
        disabled={!selectedFile}
        className={`upload-button ${!selectedFile ? 'disabled' : ''}`}
      >
        Upload & Process
      </button>
    </div>
  );
};

export default DocumentUploader; 