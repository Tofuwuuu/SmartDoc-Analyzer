import React, { useRef, useState } from 'react';

export default function App() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const handleDrop = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e) => {
    setError(null);
    setResult(null);
    const file = e.target.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setResult(`Uploaded: ${data.filename}`);
      } else {
        setError('Upload failed.');
      }
    } catch (err) {
      setError('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">SmartDoc Analyzer</h1>
      <div
        className="w-full max-w-md p-8 bg-white rounded shadow flex flex-col items-center border-2 border-dashed border-blue-400 hover:border-blue-600 transition cursor-pointer"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current.click()}
        style={{ minHeight: 180 }}
      >
        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <p className="text-gray-500">Drag & drop a PDF or image here, or click to select</p>
      </div>
      {uploading && <p className="mt-4 text-blue-500">Uploading...</p>}
      {result && <p className="mt-4 text-green-600">{result}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
} 