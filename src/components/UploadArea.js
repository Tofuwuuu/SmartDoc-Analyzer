import React, { useState, useRef } from 'react';
import { uploadDocument } from '../services/api';
import './UploadArea.css';

const UploadArea = ({ onProcessingStart, onDocumentProcessed, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    // Check if the file is a PDF or image
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      onError({ message: 'Unsupported file type. Please upload a PDF or image file.' });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleProcessClick = async () => {
    if (!selectedFile) {
      onError({ message: 'Please select a file to process' });
      return;
    }

    try {
      onProcessingStart();
      const result = await uploadDocument(selectedFile);
      onDocumentProcessed(result);
    } catch (error) {
      onError(error);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <p>Drag & drop your document here or click to browse</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept=".pdf,image/jpeg,image/png,image/tiff" 
          style={{ display: 'none' }} 
        />
      </div>

      {selectedFile && (
        <div className="selected-file">
          <p>Selected: {selectedFile.name}</p>
          <button 
            className="process-button"
            onClick={handleProcessClick}
          >
            Process Document
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadArea; 