import React from 'react';

function App() {
  return (
    <div style={{ 
      backgroundColor: 'blue', 
      color: 'white', 
      padding: '50px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px'
    }}>
      <h1 style={{ marginBottom: '20px', fontSize: '48px' }}>SmartDoc Analyzer</h1>
      <p>This is a test to see if styling works</p>
      <button 
        style={{ 
          marginTop: '30px', 
          padding: '10px 20px', 
          backgroundColor: 'white', 
          color: 'blue',
          border: 'none',
          borderRadius: '5px',
          fontSize: '18px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;
