from transformers import pipeline
import torch
import re

# Use a zero-shot classification model
MODEL_NAME = "facebook/bart-large-mnli"

class DocumentClassifier:
    _instance = None
    
    @staticmethod
    def get_instance():
        if DocumentClassifier._instance is None:
            DocumentClassifier._instance = DocumentClassifier()
        return DocumentClassifier._instance
    
    def __init__(self):
        # Initialize the classifier pipeline
        self.classifier = None
        
        # Define common document categories
        self.default_categories = [
            "resume", "cv", "cover letter", 
            "invoice", "receipt", "financial statement",
            "contract", "agreement", "legal document",
            "academic paper", "article", "report",
            "memo", "email", "letter",
            "presentation", "manual", "guide"
        ]
    
    def _load_model(self):
        if self.classifier is None:
            print("Loading document classification model...")
            self.classifier = pipeline("zero-shot-classification", model=MODEL_NAME)
            print("Document classification model loaded.")
    
    async def classify_document(self, text, categories=None):
        """
        Classify the document into predefined categories
        
        Args:
            text (str): Text to classify
            categories (list): Categories to classify into (optional)
            
        Returns:
            dict: Classification results
        """
        if not text or len(text.strip()) < 50:
            return {
                "classification": "unknown",
                "scores": {},
                "message": "Text too short for classification",
                "top_category": "unknown"
            }
        
        # Load model on first use
        if self.classifier is None:
            self._load_model()
        
        # Use default categories if none provided
        if not categories:
            categories = self.default_categories
        
        try:
            # Extract a representative sample from the document
            sample = self._extract_representative_sample(text)
            
            # Perform zero-shot classification
            result = self.classifier(sample, categories)
            
            # Organize results
            classifications = {}
            for i, label in enumerate(result["labels"]):
                classifications[label] = float(result["scores"][i])
            
            # Get top category
            top_category = result["labels"][0]
            top_score = result["scores"][0]
            
            # Only consider it classified if the score is above threshold
            if top_score < 0.5:
                top_category = "general document"
                message = "Document type unclear, may be a general document"
            else:
                message = f"Document classified as {top_category} with {top_score:.2f} confidence"
            
            return {
                "classification": classifications,
                "scores": dict(zip(result["labels"], result["scores"])),
                "message": message,
                "top_category": top_category
            }
            
        except Exception as e:
            return {
                "classification": "error",
                "scores": {},
                "message": f"Error classifying document: {str(e)}",
                "top_category": "unknown"
            }
    
    def _extract_representative_sample(self, text, max_length=1000):
        """Extract a representative sample from the document for classification"""
        # Clean the text
        text = re.sub(r'\s+', ' ', text).strip()
        
        if len(text) <= max_length:
            return text
        
        # Take beginning, middle and end sections
        third = max_length // 3
        
        beginning = text[:third]
        middle_start = max(0, (len(text) // 2) - (third // 2))
        middle = text[middle_start:middle_start + third]
        end = text[-third:]
        
        return beginning + " [...] " + middle + " [...] " + end

# Get the singleton instance
document_classifier = DocumentClassifier.get_instance() 