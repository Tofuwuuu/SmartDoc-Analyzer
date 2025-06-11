from transformers import pipeline
import torch
import re
from collections import Counter

# Use a named entity recognition model
MODEL_NAME = "dslim/bert-base-NER"

class EntityExtractor:
    _instance = None
    
    @staticmethod
    def get_instance():
        if EntityExtractor._instance is None:
            EntityExtractor._instance = EntityExtractor()
        return EntityExtractor._instance
    
    def __init__(self):
        # Initialize the NER pipeline
        self.ner = None
    
    def _load_model(self):
        if self.ner is None:
            print("Loading named entity recognition model...")
            self.ner = pipeline("ner", model=MODEL_NAME, aggregation_strategy="simple")
            print("Named entity recognition model loaded.")
    
    async def extract_entities(self, text):
        """
        Extract named entities from the text
        
        Args:
            text (str): Text to analyze
            
        Returns:
            dict: Extracted entities by category
        """
        if not text or len(text.strip()) < 10:
            return {
                "entities": {},
                "counts": {},
                "message": "Text too short for entity extraction"
            }
        
        # Load model on first use
        if self.ner is None:
            self._load_model()
        
        try:
            # For long documents, process in chunks
            if len(text) > 5000:
                chunks = self._split_text(text)
                all_entities = []
                
                for chunk in chunks:
                    if len(chunk.strip()) > 10:
                        chunk_entities = self.ner(chunk)
                        all_entities.extend(chunk_entities)
            else:
                all_entities = self.ner(text)
            
            # Group entities by type
            entities_by_type = {}
            for entity in all_entities:
                entity_type = entity["entity_group"]
                entity_text = entity["word"]
                score = entity["score"]
                
                # Skip low confidence predictions
                if score < 0.7:
                    continue
                
                # Clean up entity text
                entity_text = self._clean_entity_text(entity_text)
                if not entity_text:
                    continue
                
                if entity_type not in entities_by_type:
                    entities_by_type[entity_type] = []
                
                # Add if not duplicate
                if entity_text not in entities_by_type[entity_type]:
                    entities_by_type[entity_type].append(entity_text)
            
            # Get counts by entity type
            entity_counts = {etype: len(entities) for etype, entities in entities_by_type.items()}
            
            # Prepare response
            result = {
                "entities": entities_by_type,
                "counts": entity_counts,
                "message": f"Extracted {sum(entity_counts.values())} entities across {len(entity_counts)} categories"
            }
            
            # Add summary for common entity types
            if "PER" in entities_by_type:
                result["people"] = entities_by_type["PER"]
            if "ORG" in entities_by_type:
                result["organizations"] = entities_by_type["ORG"]
            if "LOC" in entities_by_type:
                result["locations"] = entities_by_type["LOC"]
            
            return result
            
        except Exception as e:
            return {
                "entities": {},
                "counts": {},
                "message": f"Error extracting entities: {str(e)}"
            }
    
    def _split_text(self, text, chunk_size=1000):
        """Split text into chunks for processing"""
        # Split by sentences to avoid cutting in the middle of entities
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length <= chunk_size:
                current_chunk.append(sentence)
                current_length += sentence_length
            else:
                chunks.append(' '.join(current_chunk))
                current_chunk = [sentence]
                current_length = sentence_length
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def _clean_entity_text(self, text):
        """Clean up extracted entity text"""
        # Remove special tokens and extra whitespace
        text = re.sub(r'##', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common punctuation at the edges
        text = re.sub(r'^[.,;:\'\"()[\]{}]|[.,;:\'\"()[\]{}]$', '', text).strip()
        
        return text

# Get the singleton instance
entity_extractor = EntityExtractor.get_instance() 