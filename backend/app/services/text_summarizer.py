"""
Simplified text summarizer that doesn't depend on external ML libraries.
"""

# Create a singleton pattern for the text summarizer
class TextSummarizer:
    _instance = None
    
    @staticmethod
    def get_instance():
        if TextSummarizer._instance is None:
            TextSummarizer._instance = TextSummarizer()
        return TextSummarizer._instance
    
    def __init__(self):
        print("Initializing simple text summarizer")
    
    async def generate_summary(self, text):
        """
        Simple extractive summarization without ML dependencies.
        Returns the first few sentences as a summary.
        """
        if not text or len(text.strip()) < 50:
            return "Text too short for summarization"
        
        # Split text into sentences (simple approach)
        sentences = text.replace("!", ".").replace("?", ".").split(".")
        sentences = [s.strip() for s in sentences if len(s.strip()) > 0]
        
        # Return first few sentences as summary
        num_sentences = min(3, len(sentences))
        summary = ". ".join(sentences[:num_sentences])
        
        if summary:
            return summary + ("." if not summary.endswith(".") else "")
        else:
            return "Could not generate summary"

# Get the singleton instance
text_summarizer = TextSummarizer.get_instance() 