import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">SmartDoc Analyzer Frontend</h1>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />); 