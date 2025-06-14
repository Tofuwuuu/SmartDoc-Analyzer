"""
Enhanced sentiment analyzer that provides more detailed results.
"""
import re
import math
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
        print("Initializing enhanced sentiment analyzer")
        # Extended sentiment word lists
        self.positive_words = [
            "good", "great", "excellent", "best", "happy", "positive", "love", "like", 
            "wonderful", "perfect", "amazing", "outstanding", "fantastic", "impressive",
            "brilliant", "exceptional", "superior", "innovative", "efficient", "valuable", 
            "beneficial", "successful", "effective", "reliable", "quality", "proven", 
            "satisfied", "enjoy", "appreciate", "advantage", "benefit", "improve", 
            "enhance", "advance", "progress", "solution", "opportunity", "achievement"
        ]
        
        self.negative_words = [
            "bad", "worst", "terrible", "hate", "dislike", "negative", "awful", "poor", 
            "horrible", "wrong", "issue", "problem", "difficult", "challenging", "fail", 
            "failure", "inadequate", "insufficient", "ineffective", "unfortunate", 
            "disappointing", "frustrating", "annoying", "trouble", "concern", "error", 
            "defect", "deficient", "weak", "limitation", "downside", "drawback", 
            "harmful", "risky", "danger", "threat", "corrupt", "mislead", "inconvenient"
        ]
        
        self.neutral_words = [
            "the", "and", "is", "are", "was", "were", "be", "being", "been", "have", 
            "has", "had", "do", "does", "did", "will", "would", "shall", "should", 
            "can", "could", "may", "might", "must", "about", "above", "across", 
            "after", "against", "along", "among", "around", "at", "before", "behind", 
            "below", "beneath", "beside", "between", "beyond", "but", "by", "despite", 
            "down", "during", "except", "for", "from", "in", "inside", "into", "like", 
            "near", "of", "off", "on", "onto", "out", "outside", "over", "past", "since", 
            "through", "throughout", "to", "toward", "under", "underneath", "until", "up", 
            "upon", "with", "within", "without", "system", "process", "method", "data", "information"
        ]
    
    def _calculate_sentence_sentiments(self, text):
        """Calculate sentiment for each sentence in the text"""
        # Split into sentences
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        sentence_sentiments = []
        for sentence in sentences:
            words = re.findall(r'\b\w+\b', sentence.lower())
            if not words:
                continue
                
            pos_count = sum(1 for word in words if word in self.positive_words)
            neg_count = sum(1 for word in words if word in self.negative_words)
            neu_count = sum(1 for word in words if word in self.neutral_words)
            
            # Calculate sentiment scores for this sentence
            total_matched = pos_count + neg_count + neu_count
            if total_matched == 0:
                total_matched = 1  # Avoid division by zero
                
            pos_score = pos_count / total_matched
            neg_score = neg_count / total_matched
            neu_score = neu_count / total_matched
            
            # Determine primary sentiment
            if pos_score > neg_score and pos_score > neu_score:
                primary = "POSITIVE"
                score = 0.5 + (pos_score / 2)  # Scale to 0.5-1.0
            elif neg_score > pos_score and neg_score > neu_score:
                primary = "NEGATIVE"
                score = 0.5 - (neg_score / 2)  # Scale to 0-0.5
            else:
                primary = "NEUTRAL"
                score = 0.5
                
            sentence_sentiments.append({
                "text": sentence,
                "sentiment": primary,
                "score": round(score, 4),
                "distribution": {
                    "positive": round(pos_score, 4),
                    "negative": round(neg_score, 4),
                    "neutral": round(neu_score, 4)
                }
            })
            
        return sentence_sentiments
        
    async def analyze_sentiment(self, text):
        """
        Enhanced sentiment analysis implementation.
        Returns detailed sentiment analysis with distribution and sentence-level breakdown.
        """
        if not text or len(text) < 10:
            return {
                "label": "NEUTRAL",
                "score": 0.5,
                "confidence": 0.3,
                "method": "default",
                "message": "Text too short for reliable sentiment analysis.",
                "distribution": {
                    "positive": 0.23,
                    "neutral": 0.54,
                    "negative": 0.23
                }
            }
        
        # Convert to lowercase for matching
        text_lower = text.lower()
        
        # Get sentence-level sentiment
        sentences = self._calculate_sentence_sentiments(text)
        
        if not sentences:
            return {
                "label": "NEUTRAL",
                "score": 0.5,
                "confidence": 0.3,
                "method": "default",
                "message": "Could not parse sentences for sentiment analysis.",
                "distribution": {
                    "positive": 0.23,
                    "neutral": 0.54,
                    "negative": 0.23
                }
            }
        
        # Calculate overall distribution
        pos_total = sum(s["distribution"]["positive"] for s in sentences)
        neg_total = sum(s["distribution"]["negative"] for s in sentences)
        neu_total = sum(s["distribution"]["neutral"] for s in sentences)
        
        total_distribution = pos_total + neg_total + neu_total
        if total_distribution == 0:
            total_distribution = 1  # Avoid division by zero
        
        distribution = {
            "positive": round(pos_total / total_distribution, 4),
            "negative": round(neg_total / total_distribution, 4),
            "neutral": round(neu_total / total_distribution, 4)
        }
        
        # Calculate overall sentiment
        scores = [s["score"] for s in sentences]
        avg_score = sum(scores) / len(scores) if scores else 0.5
        
        # Determine confidence based on consistency of sentence sentiments
        if scores:
            variance = sum((s - avg_score) ** 2 for s in scores) / len(scores)
            std_dev = math.sqrt(variance)
            confidence = max(0.3, min(0.95, 1.0 - std_dev))
        else:
            confidence = 0.3
        
        # Determine label
        if avg_score > 0.6:
            label = "POSITIVE"
        elif avg_score < 0.4:
            label = "NEGATIVE"
        else:
            label = "NEUTRAL"
            
        # Create message based on analysis
        if label == "POSITIVE":
            message = f"The document has an overall positive tone with {round(distribution['positive']*100)}% positive sentiment."
        elif label == "NEGATIVE":
            message = f"The document has an overall negative tone with {round(distribution['negative']*100)}% negative sentiment."
        else:
            message = f"The document has a mainly neutral tone with {round(distribution['neutral']*100)}% neutral content."
            
        if confidence < 0.5:
            message += " Low confidence due to mixed sentiment throughout the document."
            
        return {
            "label": label,
            "score": round(avg_score, 4),
            "confidence": round(confidence, 4),
            "method": "enhanced_lexicon",
            "message": message,
            "distribution": distribution,
            "sentences": sentences[:5]  # Include the first 5 sentence analyses
        }

# Get the singleton instance
sentiment_analyzer = SentimentAnalyzer.get_instance() 