from transformers import pipeline
import os
import torch

# Use smaller model for faster loading
MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"

# Create a singleton pattern for the sentiment analyzer
class SentimentAnalyzer:
    _instance = None
    
    @staticmethod
    def get_instance():
        if SentimentAnalyzer._instance is None:
            SentimentAnalyzer._instance = SentimentAnalyzer()
        return SentimentAnalyzer._instance
    
    def __init__(self):
        # Initialize the sentiment analysis pipeline
        self.analyzer = None
    
    def _load_model(self):
        if self.analyzer is None:
            print("Loading sentiment analysis model...")
            self.analyzer = pipeline("sentiment-analysis", model=MODEL_NAME)
            print("Sentiment analysis model loaded.")
    
    async def analyze_sentiment(self, text):
        """
        Analyze the sentiment of the given text
        
        Args:
            text (str): Text to analyze
            
        Returns:
            dict: Sentiment analysis result with label and score
        """
        if not text or len(text.strip()) < 10:
            return {"label": "neutral", "score": 0.5, "message": "Text too short for analysis"}
        
        # Load model on first use
        if self.analyzer is None:
            self._load_model()
        
        # For long documents, analyze chunks and average results
        if len(text) > 1000:
            chunks = self._split_text(text)
            results = []
            
            for chunk in chunks:
                if len(chunk.strip()) > 10:  # Only analyze non-empty chunks
                    result = self.analyzer(chunk)[0]
                    results.append(result)
            
            # Calculate average sentiment
            if results:
                positive_score = sum(1 for r in results if r["label"] == "POSITIVE") / len(results)
                if positive_score > 0.6:
                    return {"label": "POSITIVE", "score": positive_score, "message": "Document sentiment is primarily positive"}
                elif positive_score < 0.4:
                    return {"label": "NEGATIVE", "score": 1 - positive_score, "message": "Document sentiment is primarily negative"}
                else:
                    return {"label": "NEUTRAL", "score": 0.5, "message": "Document sentiment is mixed or neutral"}
            else:
                return {"label": "neutral", "score": 0.5, "message": "Could not analyze sentiment"}
        else:
            try:
                result = self.analyzer(text)[0]
                return {
                    "label": result["label"],
                    "score": result["score"],
                    "message": f"Document sentiment is {result['label'].lower()}"
                }
            except Exception as e:
                return {"label": "ERROR", "score": 0, "message": f"Error analyzing sentiment: {str(e)}"}
    
    def _split_text(self, text, chunk_size=500):
        """Split text into chunks for processing"""
        words = text.split()
        chunks = []
        current_chunk = []
        current_length = 0
        
        for word in words:
            current_chunk.append(word)
            current_length += len(word) + 1  # +1 for space
            
            if current_length >= chunk_size:
                chunks.append(" ".join(current_chunk))
                current_chunk = []
                current_length = 0
        
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        
        return chunks

# Get the singleton instance
sentiment_analyzer = SentimentAnalyzer.get_instance() 