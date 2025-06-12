import React, { useState, useEffect } from 'react';

interface EntityVisualizationProps {
  text: string;
  entities: Record<string, any>;
}

// Define entity colors with dark mode compatibility
const entityColors: Record<string, { light: string; dark: string }> = {
  person: { 
    light: 'rgba(79, 70, 229, 0.2)', 
    dark: 'rgba(129, 140, 248, 0.3)' 
  },
  organization: { 
    light: 'rgba(245, 158, 11, 0.2)', 
    dark: 'rgba(251, 191, 36, 0.3)' 
  },
  location: { 
    light: 'rgba(16, 185, 129, 0.2)', 
    dark: 'rgba(52, 211, 153, 0.3)' 
  },
  date: { 
    light: 'rgba(236, 72, 153, 0.2)', 
    dark: 'rgba(244, 114, 182, 0.3)' 
  },
  email: { 
    light: 'rgba(6, 182, 212, 0.2)', 
    dark: 'rgba(34, 211, 238, 0.3)' 
  },
  phone: { 
    light: 'rgba(168, 85, 247, 0.2)', 
    dark: 'rgba(196, 181, 253, 0.3)' 
  },
  url: { 
    light: 'rgba(239, 68, 68, 0.2)', 
    dark: 'rgba(248, 113, 113, 0.3)' 
  },
  money: { 
    light: 'rgba(5, 150, 105, 0.2)', 
    dark: 'rgba(16, 185, 129, 0.3)' 
  },
  default: { 
    light: 'rgba(107, 114, 128, 0.2)', 
    dark: 'rgba(156, 163, 175, 0.3)' 
  }
};

// Get color for each entity type
const getEntityColor = (type: string, isDarkMode: boolean): string => {
  const colorSet = entityColors[type] || entityColors.default;
  return isDarkMode ? colorSet.dark : colorSet.light;
};

const EntityVisualization: React.FC<EntityVisualizationProps> = ({ text, entities }) => {
  const [highlightedText, setHighlightedText] = useState<React.ReactNode[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    document.documentElement.classList.contains('dark')
  );
  
  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    // If no entities or no text, just show the text
    if (!entities || !text || Object.keys(entities).length === 0) {
      setHighlightedText([text]);
      return;
    }
    
    // Prepare all entities for highlighting
    const allEntities: {
      type: string;
      text: string;
      index: number;
      length: number;
    }[] = [];
    
    // Extract entities from the response structure
    Object.entries(entities.entities || {}).forEach(([type, values]) => {
      if (Array.isArray(values)) {
        values.forEach((value: string) => {
          // Find all occurrences of this entity in the text
          let index = text.indexOf(value);
          while (index !== -1) {
            allEntities.push({
              type,
              text: value,
              index,
              length: value.length,
            });
            index = text.indexOf(value, index + 1);
          }
        });
      }
    });
    
    // Handle the case where we extracted possible names
    if (entities.entities.possible_names && Array.isArray(entities.entities.possible_names)) {
      entities.entities.possible_names.forEach((name: string) => {
        let index = text.indexOf(name);
        while (index !== -1) {
          allEntities.push({
            type: 'person',
            text: name,
            index,
            length: name.length,
          });
          index = text.indexOf(name, index + 1);
        }
      });
    }
    
    // Sort entities by position in text to process in order
    allEntities.sort((a, b) => a.index - b.index);
    
    // Now highlight all entities
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    allEntities.forEach((entity) => {
      // Skip if filtered and not the active type
      if (activeFilter && entity.type !== activeFilter) {
        return;
      }
      
      // Add text before this entity
      if (entity.index > lastIndex) {
        result.push(text.substring(lastIndex, entity.index));
      }
      
      // Add the highlighted entity
      result.push(
        <mark 
          key={`entity-${entity.index}`} 
          className={`entity-highlight entity-${entity.type}`}
          style={{ 
            backgroundColor: getEntityColor(entity.type, isDarkMode),
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`
          }}
          title={`${entity.type}: ${entity.text}`}
        >
          {entity.text}
        </mark>
      );
      
      lastIndex = entity.index + entity.length;
    });
    
    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex));
    }
    
    setHighlightedText(result);
  }, [text, entities, activeFilter, isDarkMode]);
  
  // Get unique entity types for filter buttons
  const entityTypes = entities?.entities 
    ? Object.keys(entities.entities).filter(type => 
        Array.isArray(entities.entities[type]) && entities.entities[type].length > 0
      ) 
    : [];
  
  // Special case for "possible_names" which we treat as "person" type
  if (entityTypes.includes('possible_names')) {
    const index = entityTypes.indexOf('possible_names');
    entityTypes[index] = 'person';
  }
  
  // Make entity types unique
  const uniqueEntityTypes = Array.from(new Set(entityTypes));
  
  return (
    <div className="entity-visualization">
      {uniqueEntityTypes.length > 0 && (
        <div className="entity-filters">
          <div className="filter-label">Filter entities:</div>
          <div className="filter-buttons">
            {activeFilter && (
              <button 
                className="filter-button clear-filter"
                onClick={() => setActiveFilter(null)}
              >
                Clear filter
              </button>
            )}
            
            {uniqueEntityTypes.map((type) => (
              <button
                key={type}
                className={`filter-button ${activeFilter === type ? 'active' : ''}`}
                style={{
                  backgroundColor: activeFilter === type 
                    ? getEntityColor(type, isDarkMode) 
                    : 'transparent',
                  borderColor: getEntityColor(type, isDarkMode)
                }}
                onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="entity-text">
        {highlightedText}
      </div>
    </div>
  );
};

export default EntityVisualization; 