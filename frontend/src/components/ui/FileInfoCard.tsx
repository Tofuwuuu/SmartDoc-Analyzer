import React from 'react';

interface FileInfoProps {
  filename: string;
  fileType: string;
  fileSize: number;
  contentType: string;
  timestamp?: string;
}

const FileInfoCard: React.FC<FileInfoProps> = ({ 
  filename, 
  fileType, 
  fileSize, 
  contentType,
  timestamp 
}) => {
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Get file extension for icon selection
  const getFileExtension = (name: string): string => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const extension = getFileExtension(filename);
  
  // Determine file type icon
  const getFileIcon = () => {
    switch (extension) {
      case 'pdf':
        return (
          <svg className="file-icon pdf" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 14H14V20H20V14Z" fill="#FF5252" />
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
        return (
          <svg className="file-icon image" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M6 20L18 10L20 12V18C20 19.1046 19.1046 20 18 20H6Z" fill="#4CAF50" />
          </svg>
        );
      case 'tiff':
      case 'tif':
        return (
          <svg className="file-icon tiff" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M4 16L8 12L10 14L15 9L20 14V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16Z" fill="#2196F3" />
          </svg>
        );
      default:
        return (
          <svg className="file-icon default" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  return (
    <div className="file-info-card">
      <div className="file-info-icon-container">
        {getFileIcon()}
      </div>
      <div className="file-info-details">
        <div className="file-name">{filename}</div>
        <div className="file-meta">
          <span className="file-type">{fileType}</span>
          <span className="file-dot">•</span>
          <span className="file-size">{formatFileSize(fileSize)}</span>
          <span className="file-dot">•</span>
          <span className="file-content-type">{contentType}</span>
          {timestamp && (
            <>
              <span className="file-dot">•</span>
              <span className="file-timestamp">{timestamp}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileInfoCard; 