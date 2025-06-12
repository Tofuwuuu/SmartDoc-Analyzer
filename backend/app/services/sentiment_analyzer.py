"""
Simplified sentiment analyzer that doesn't depend on external ML libraries.
"""
import random

# Create a singleton pattern for the sentiment analyzer
class SentimentAnalyzer:
    _instance = None
    
    @staticmethod
    def get_instance():
        if SentimentAnalyzer._instance is None:
            SentimentAnalyzer._instance = SentimentAnalyzer()
        return SentimentAnalyzer._instance
    
    def __init__(self):
        print("Initializing simple sentiment analyzer")
    
    async def analyze_sentiment(self, text):
        """
        Simple sentiment analysis implementation without ML dependencies.
        Returns positive/negative/neutral based on basic keyword matching.
        """
        # Simple keyword-based sentiment analysis
        positive_words = ["good", "great", "excellent", "best", "happy", "positive", "love", "like", "wonderful", "perfect"]
        negative_words = ["bad", "worst", "terrible", "hate", "dislike", "negative", "awful", "poor", "horrible", "wrong"]
        
        # Convert to lowercase for matching
        text_lower = text.lower()
        
        # Count occurrences
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        # Determine sentiment
        if positive_count > negative_count:
            label = "POSITIVE"
            score = 0.7 + (0.3 * random.random())  # Random score between 0.7-1.0
        elif negative_count > positive_count:
            label = "NEGATIVE"
            score = 0.7 + (0.3 * random.random())  # Random score between 0.7-1.0
        else:
            label = "NEUTRAL"
            score = 0.5 + (0.2 * random.random() - 0.1)  # Random score between 0.4-0.6
        
        return {
            "label": label,
            "score": round(score, 4),
            "method": "keyword_based"
        }

# Get the singleton instance
sentiment_analyzer = SentimentAnalyzer.get_instance() 