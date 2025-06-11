import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="logo-container">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="logo-icon" 
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
            <div>
              <h1 className="title">SmartDoc Analyzer</h1>
              <p className="subtitle">AI-powered Document Intelligence Platform</p>
            </div>
          </div>
          <div>
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 