import React, { useState } from 'react';

interface EnhancedEntityVisualizationProps {
  entities: {
    entities: Record<string, string[]>;
  };
}

const EnhancedEntityVisualization: React.FC<EnhancedEntityVisualizationProps> = ({ 
  entities 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Extract entity data
  const entityData = entities?.entities || {};
  const entityCategories = Object.keys(entityData).filter(key => 
    Array.isArray(entityData[key]) && entityData[key].length > 0
  );
  
  // Get entity counts by category
  const entityCounts: Record<string, number> = {};
  entityCategories.forEach(category => {
    entityCounts[category] = Array.isArray(entityData[category]) ? entityData[category].length : 0;
  });
  
  // Colors for different entity types
  const entityColors: Record<string, string> = {
    person: '#8884d8',
    organization: '#ffc658',
    location: '#82ca9d',
    date: '#ff8042',
    possible_names: '#8884d8', // Same as person
    default: '#a4a4a4'
  };
  
  // Get color for entity type
  const getEntityColor = (type: string): string => {
    return entityColors[type] || entityColors.default;
  };
  
  // Get the highest count for scaling
  const maxCount = Math.max(...Object.values(entityCounts));
  
  return (
    <div className="enhanced-entity-visualization">
      <h4 className="visualization-title">Entity Distribution</h4>
      
      <div className="entity-table-container">
        <table className="entity-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Values</th>
            </tr>
          </thead>
          <tbody>
            {entityCategories.map(category => (
              <tr key={category}>
                <td className="entity-category">
                  <span 
                    className="entity-category-indicator"
                    style={{ backgroundColor: getEntityColor(category) }}
                  ></span>
                  {category.toUpperCase()}
                </td>
                <td className="entity-values">
                  {Array.isArray(entityData[category]) && entityData[category].slice(0, 3).map((value, index) => (
                    <span key={index} className="entity-value">
                      {value}{index < Math.min(entityData[category].length, 3) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {Array.isArray(entityData[category]) && entityData[category].length > 3 && (
                    <span className="entity-more">+{entityData[category].length - 3} more</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="entity-chart">
        <h4 className="visualization-subtitle">Entity Count</h4>
        <div className="entity-bars">
          {entityCategories.map(category => (
            <div 
              key={category}
              className="entity-bar-container"
              onMouseEnter={() => setSelectedCategory(category)}
              onMouseLeave={() => setSelectedCategory(null)}
            >
              <div className="entity-bar-label">{category}</div>
              <div className="entity-bar-wrapper">
                <div 
                  className="entity-bar"
                  style={{ 
                    height: `${(entityCounts[category] / maxCount) * 100}%`,
                    backgroundColor: getEntityColor(category),
                    opacity: selectedCategory === null || selectedCategory === category ? 1 : 0.3
                  }}
                ></div>
              </div>
              <div className="entity-bar-count">{entityCounts[category]}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="entity-relationships">
        <h4 className="visualization-subtitle">Relationship Map</h4>
        <div className="relationship-map">
          <svg width="100%" height="200" viewBox="0 0 600 200">
            {/* Central node */}
            <circle cx="300" cy="100" r="30" fill="#e1e1e1" />
            <text x="300" y="105" textAnchor="middle" fontSize="12">Document</text>
            
            {/* Entity nodes */}
            {entityCategories.map((category, index) => {
              const angle = (index * (2 * Math.PI)) / entityCategories.length;
              const x = 300 + Math.cos(angle) * 120;
              const y = 100 + Math.sin(angle) * 80;
              
              return (
                <g key={category}>
                  {/* Line connecting to central node */}
                  <line 
                    x1="300" 
                    y1="100" 
                    x2={x} 
                    y2={y} 
                    stroke="#ccc" 
                    strokeWidth="2"
                    strokeDasharray={selectedCategory === category ? "none" : "3,3"}
                    opacity={selectedCategory === null || selectedCategory === category ? 1 : 0.3}
                  />
                  
                  {/* Entity node */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={15 + Math.min(10, entityCounts[category] / 2)}
                    fill={getEntityColor(category)}
                    opacity={selectedCategory === null || selectedCategory === category ? 0.8 : 0.3}
                  />
                  
                  {/* Entity label */}
                  <text 
                    x={x} 
                    y={y} 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    opacity={selectedCategory === null || selectedCategory === category ? 1 : 0.3}
                  >
                    {category.slice(0, 3).toUpperCase()}
                  </text>
                  
                  {/* Entity count */}
                  <text 
                    x={x} 
                    y={y + 25} 
                    textAnchor="middle" 
                    fill="#333"
                    fontSize="10"
                    opacity={selectedCategory === null || selectedCategory === category ? 1 : 0.3}
                  >
                    {entityCounts[category]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEntityVisualization; 