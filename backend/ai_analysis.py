from transformers import pipeline
import spacy
import joblib
import re
from collections import defaultdict

# Load models once at startup
try:
    nlp = spacy.load("en_core_web_sm")
    sentiment_analyzer = pipeline('sentiment-analysis', model='distilbert-base-uncased-finetuned-sst-2-english')
    classifier = joblib.load('models/document_classifier.pkl')
except:
    # Fallback for initial setup
    nlp = None
    sentiment_analyzer = None
    classifier = None

def analyze_content(text: str) -> dict:
    """Perform all AI analysis on text content"""
    if not text.strip():
        return {}
    
    insights = {
        "classification": classify_document(text),
        "sentiment": analyze_sentiment(text),
        "entities": extract_entities(text),
        "keywords": extract_keywords(text)
    }
    return insights

def classify_document(text: str) -> dict:
    """Classify document type"""
    if not classifier:
        return {"type": "Unknown", "confidence": 0}
    
    # Simplified classification (real implementation would use proper feature extraction)
    doc_types = ["Resume", "Contract", "Research Paper", "Report", "Letter", "Thesis"]
    features = [len(text), text.count('\n'), len(text.split())]
    
    # Predict
    pred = classifier.predict([features])[0]
    confidence = 0.85  # Placeholder
    
    return {
        "type": doc_types[pred],
        "confidence": f"{confidence*100:.1f}%"
    }

def analyze_sentiment(text: str) -> dict:
    """Analyze document sentiment"""
    if not sentiment_analyzer:
        return {"label": "Neutral", "score": 0.5}
    
    # Process in chunks
    chunk_size = 500
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    results = sentiment_analyzer(chunks)
    
    # Calculate weighted average
    pos_score = 0
    total = 0
    for res in results:
        weight = len(res['sequence']) / len(text)
        score = res['score'] if res['label'] == 'POSITIVE' else 1 - res['score']
        pos_score += score * weight
        total += weight
    
    avg_score = pos_score / total if total > 0 else 0.5
    return {
        "label": "Positive" if avg_score > 0.6 else "Negative" if avg_score < 0.4 else "Neutral",
        "score": f"{avg_score:.2f}"
    }

def extract_entities(text: str) -> dict:
    """Extract named entities"""
    if not nlp:
        return {}
    
    doc = nlp(text)
    entities = defaultdict(list)
    
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "GPE", "PRODUCT"]:
            entities[ent.label_].append(ent.text)
    
    # Extract custom patterns
    entities["EMAIL"] = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    entities["PHONE"] = re.findall(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    
    return {k: list(set(v)) for k, v in entities.items()}

def extract_keywords(text: str, top_n: int = 10) -> list:
    """Extract top keywords using TF-IDF"""
    # Simplified implementation - real version would use scikit-learn
    words = [word.lower() for word in text.split() if len(word) > 3]
    word_freq = {}
    for word in words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [word for word, _ in sorted_words[:top_n]]