import re
import os
import joblib
from typing import Dict, List, Any

# Define paths to models
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "document_classifier.pkl")

def analyze_content(text: str) -> Dict[str, Any]:
    """
    Perform AI analysis on document text
    """
    result = {
        "document_type": classify_document(text),
        "entities": extract_entities(text),
        "sentiment": analyze_sentiment(text),
        "summary": generate_summary(text)
    }
    return result

def classify_document(text: str) -> str:
    """
    Classify document type based on content
    """
    # Placeholder for actual model inference
    # In a real implementation, you would load a trained model:
    # if os.path.exists(CLASSIFIER_PATH):
    #     classifier = joblib.load(CLASSIFIER_PATH)
    #     return classifier.predict([text])[0]
    
    # Simple rule-based classification for demonstration
    text_lower = text.lower()
    
    if "invoice" in text_lower or "payment" in text_lower or "amount" in text_lower:
        return "Invoice"
    elif "resume" in text_lower or "experience" in text_lower or "education" in text_lower:
        return "Resume"
    elif "contract" in text_lower or "agreement" in text_lower or "parties" in text_lower:
        return "Contract"
    elif "report" in text_lower or "analysis" in text_lower or "findings" in text_lower:
        return "Report"
    else:
        return "General Document"

def extract_entities(text: str) -> Dict[str, List[str]]:
    """
    Extract named entities from text
    """
    # Placeholder for NER model
    # In a real implementation, you would use spaCy or a custom NER model
    
    # Simple regex-based entity extraction for demonstration
    entities = {
        "dates": [],
        "emails": [],
        "phones": [],
        "amounts": []
    }
    
    # Extract dates (simple pattern)
    date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    entities["dates"] = re.findall(date_pattern, text)
    
    # Extract emails
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    entities["emails"] = re.findall(email_pattern, text)
    
    # Extract phone numbers (simple pattern)
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    entities["phones"] = re.findall(phone_pattern, text)
    
    # Extract monetary amounts
    amount_pattern = r'\$\s*\d+(?:\.\d{2})?'
    entities["amounts"] = re.findall(amount_pattern, text)
    
    return entities

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of the document text
    """
    # Placeholder for sentiment analysis model
    # In a real implementation, you would use a trained model
    
    # Simple rule-based sentiment scoring for demonstration
    positive_words = ["good", "great", "excellent", "positive", "best", "happy", "satisfaction"]
    negative_words = ["bad", "poor", "negative", "worst", "unhappy", "dissatisfaction", "problem"]
    
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)
    
    positive_count = sum(1 for word in words if word in positive_words)
    negative_count = sum(1 for word in words if word in negative_words)
    total_words = len(words)
    
    if total_words == 0:
        return {"score": 0, "label": "Neutral"}
    
    pos_ratio = positive_count / total_words
    neg_ratio = negative_count / total_words
    
    sentiment_score = (pos_ratio - neg_ratio) * 100
    
    if sentiment_score > 5:
        sentiment_label = "Positive"
    elif sentiment_score < -5:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"
    
    return {
        "score": round(sentiment_score, 2),
        "label": sentiment_label
    }

def generate_summary(text: str, max_sentences: int = 3) -> str:
    """
    Generate a short summary of the document
    """
    # Placeholder for text summarization model
    # In a real implementation, you would use a transformer model
    
    # Simple extractive summarization for demonstration
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    if len(sentences) <= max_sentences:
        return text
    
    # Use the first few sentences as a summary
    summary = " ".join(sentences[:max_sentences])
    return summary 