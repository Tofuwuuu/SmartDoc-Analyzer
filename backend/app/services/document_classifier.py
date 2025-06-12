"""
Simplified document classifier that doesn't depend on external ML libraries.
"""
import re

class DocumentClassifier:
    _instance = None
    
    @staticmethod
    def get_instance():
        if DocumentClassifier._instance is None:
            DocumentClassifier._instance = DocumentClassifier()
        return DocumentClassifier._instance
    
    def __init__(self):
        print("Initializing simple document classifier")
        
        # Define common document categories
        self.categories = [
            "resume", "cv", "cover letter", 
            "invoice", "receipt", "financial statement",
            "contract", "agreement", "legal document",
            "academic paper", "article", "report",
            "memo", "email", "letter",
            "presentation", "manual", "guide"
        ]
        
        # Define keywords for each category
        self.category_keywords = {
            "resume": ["experience", "skills", "education", "work history", "resume", "cv", "curriculum vitae"],
            "invoice": ["invoice", "payment", "due date", "amount due", "bill", "charge", "tax", "subtotal"],
            "contract": ["agreement", "terms", "conditions", "parties", "clause", "hereinafter", "contract"],
            "academic": ["abstract", "methodology", "literature review", "conclusion", "references", "cited"],
            "email": ["subject", "dear", "regards", "sent", "from", "to", "cc", "forwarded", "replied", "@"],
            "manual": ["guide", "instructions", "how to", "manual", "step", "procedure"]
        }
    
    async def classify_document(self, text):
        """
        Simple rule-based document classification without ML dependencies.
        Matches document content against predefined keywords.
        """
        if not text or len(text.strip()) < 50:
            return {
                "label": "unknown",
                "score": 0.0,
                "message": "Text too short for classification"
            }
        
        # Convert to lowercase for matching
        text_lower = text.lower()
        
        # Count keyword matches for each category
        scores = {}
        for category, keywords in self.category_keywords.items():
            score = 0
            for keyword in keywords:
                matches = len(re.findall(r'\b' + re.escape(keyword) + r'\b', text_lower))
                score += matches * 0.1  # Each match adds 0.1 to the score
            
            # Cap the score at 1.0
            scores[category] = min(score, 1.0)
        
        # Find the category with the highest score
        best_category = max(scores.items(), key=lambda x: x[1]) if scores else ("unknown", 0.0)
        
        # Return classification
        if best_category[1] > 0.3:  # Minimum threshold for classification
            return {
                "label": best_category[0],
                "score": round(best_category[1], 2),
                "method": "keyword_based"
            }
        else:
            return {
                "label": "unknown",
                "score": 0.0,
                "method": "keyword_based"
            }

# Get the singleton instance
document_classifier = DocumentClassifier.get_instance() 