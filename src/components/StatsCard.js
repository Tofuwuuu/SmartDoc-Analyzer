import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value }) => {
  // Format the value if it's a number, otherwise display as is
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : value;

  return (
    <div className="stats-card">
      <div className="stats-card-title">{title}</div>
      <div className="stats-card-value">{formattedValue}</div>
    </div>
  );
};

export default StatsCard; 