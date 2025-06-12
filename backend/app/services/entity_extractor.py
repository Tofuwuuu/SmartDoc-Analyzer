"""
Simplified entity extractor that doesn't depend on external ML libraries.
"""
import re
from collections import Counter

class EntityExtractor:
    _instance = None
    
    @staticmethod
    def get_instance():
        if EntityExtractor._instance is None:
            EntityExtractor._instance = EntityExtractor()
        return EntityExtractor._instance
    
    def __init__(self):
        print("Initializing simple entity extractor")
        
        # Define regex patterns for common entities
        self.patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
            "url": r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*\??[/\w\.-]*',
            "date": r'\b(?:\d{1,2}[/\.-]\d{1,2}[/\.-]\d{2,4})|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b',
            "money": r'\$\s?\d+(?:\.\d{2})?(?:k|K|m|M|b|B)?|\d+\s?(?:dollars|USD|EUR|GBP)'
        }
    
    async def extract_entities(self, text):
        """
        Simple regex-based entity extraction without ML dependencies.
        Extracts emails, phone numbers, URLs, dates, and monetary values.
        """
        if not text or len(text.strip()) < 10:
            return {
                "entities": {},
                "counts": {},
                "message": "Text too short for entity extraction"
            }
        
        entities = {}
        counts = {}
        
        # Extract entities using regex patterns
        for entity_type, pattern in self.patterns.items():
            matches = re.findall(pattern, text)
            if matches:
                entities[entity_type] = list(set(matches))  # Remove duplicates
                counts[entity_type] = len(entities[entity_type])
        
        # Look for possible names (simple heuristic for capitalized words)
        name_candidates = re.findall(r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b', text)
        if name_candidates:
            entities["possible_names"] = list(set(name_candidates))
            counts["possible_names"] = len(entities["possible_names"])
        
        # Return extracted entities
        return {
            "entities": entities,
            "counts": counts,
            "message": "Entities extracted using regex patterns"
        }

# Get the singleton instance
entity_extractor = EntityExtractor.get_instance() 