from transformers import pipeline
import torch

# Use a lightweight model for summarization
MODEL_NAME = "facebook/bart-large-cnn"

class TextSummarizer:
    _instance = None
    
    @staticmethod
    def get_instance():
        if TextSummarizer._instance is None:
            TextSummarizer._instance = TextSummarizer()
        return TextSummarizer._instance
    
    def __init__(self):
        # Initialize the summarization pipeline
        self.summarizer = None
    
    def _load_model(self):
        if self.summarizer is None:
            print("Loading text summarization model...")
            self.summarizer = pipeline("summarization", model=MODEL_NAME)
            print("Text summarization model loaded.")
    
    async def generate_summary(self, text, max_length=150, min_length=50):
        """
        Generate a summary of the given text
        
        Args:
            text (str): Text to summarize
            max_length (int): Maximum length of summary
            min_length (int): Minimum length of summary
            
        Returns:
            dict: Summarization result
        """
        if not text or len(text.strip()) < 100:
            return {
                "summary": "",
                "message": "Text too short for summarization",
                "original_length": len(text) if text else 0,
                "summary_length": 0
            }
        
        # Load model on first use
        if self.summarizer is None:
            self._load_model()
        
        try:
            # BART models typically have a 1024 token limit
            # For longer texts, we need to split and summarize parts
            if len(text) > 4000:  # Approximate character count for token limit
                chunks = self._split_text_for_summarization(text)
                chunk_summaries = []
                
                for chunk in chunks:
                    if len(chunk.strip()) > 100:
                        summary = self.summarizer(chunk, max_length=max_length//len(chunks), 
                                                min_length=min_length//len(chunks))
                        chunk_summaries.append(summary[0]['summary_text'])
                
                final_summary = " ".join(chunk_summaries)
                
                # If combined summary is still too long, summarize again
                if len(final_summary) > 2000:
                    final_summary = self.summarizer(final_summary, max_length=max_length, 
                                                min_length=min_length)[0]['summary_text']
                
                return {
                    "summary": final_summary,
                    "message": "Document summarized successfully (chunked processing)",
                    "original_length": len(text),
                    "summary_length": len(final_summary)
                }
            else:
                summary = self.summarizer(text, max_length=max_length, min_length=min_length)
                
                return {
                    "summary": summary[0]['summary_text'],
                    "message": "Document summarized successfully",
                    "original_length": len(text),
                    "summary_length": len(summary[0]['summary_text'])
                }
                
        except Exception as e:
            return {
                "summary": "",
                "message": f"Error generating summary: {str(e)}",
                "original_length": len(text),
                "summary_length": 0
            }
    
    def _split_text_for_summarization(self, text, max_chunk_size=3500):
        """Split text into chunks suitable for summarization"""
        # Split by paragraphs first
        paragraphs = text.split('\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        for para in paragraphs:
            # Skip empty paragraphs
            if not para.strip():
                continue
                
            para_length = len(para)
            
            # If a single paragraph is too long, split it
            if para_length > max_chunk_size:
                sentences = para.split('. ')
                for sentence in sentences:
                    sentence = sentence.strip() + '. '
                    sentence_length = len(sentence)
                    
                    if current_length + sentence_length <= max_chunk_size:
                        current_chunk.append(sentence)
                        current_length += sentence_length
                    else:
                        chunks.append(' '.join(current_chunk))
                        current_chunk = [sentence]
                        current_length = sentence_length
            else:
                # If adding this paragraph would exceed max size, start a new chunk
                if current_length + para_length > max_chunk_size:
                    chunks.append(' '.join(current_chunk))
                    current_chunk = [para]
                    current_length = para_length
                else:
                    current_chunk.append(para)
                    current_length += para_length
        
        # Add the last chunk if not empty
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks

# Get the singleton instance
text_summarizer = TextSummarizer.get_instance() 