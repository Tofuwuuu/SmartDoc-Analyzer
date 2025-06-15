import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value }) => {
  return (
    <div className="stats-card">
      <div className="stats-value">{value.toLocaleString()}</div>
      <div className="stats-title">{title}</div>
    </div>
  );
};

export default StatsCard; 