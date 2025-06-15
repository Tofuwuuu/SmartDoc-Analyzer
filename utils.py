import os
import re
import uuid
from collections import Counter
from typing import Dict, List, Tuple
from fastapi import UploadFile, HTTPException

# Define uploads directory
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save an uploaded file to disk and return the file path
    """
    # Ensure uploads directory exists
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    content = await upload_file.read()
    
    # Generate a unique filename
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    # Check file type (allow only PDF and images)
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp']
    if file_extension.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type. Only PDF and images are supported.")
    
    # Save the file
    with open(file_path, "wb") as f:
        f.write(content)
    
    return file_path

def calculate_text_stats(text: str) -> Dict[str, int]:
    """
    Calculate basic text statistics
    """
    # Count characters (including spaces)
    char_count = len(text)
    
    # Count characters (excluding spaces)
    char_count_no_spaces = len(text.replace(" ", ""))
    
    # Count words
    words = re.findall(r'\b\w+\b', text.lower())
    word_count = len(words)
    
    # Count sentences (basic approximation)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    sentence_count = len(sentences)
    
    # Count paragraphs (basic approximation)
    paragraphs = text.split("\n\n")
    paragraph_count = len([p for p in paragraphs if p.strip()])
    
    return {
        "characters": char_count,
        "characters_no_spaces": char_count_no_spaces,
        "words": word_count,
        "sentences": sentence_count,
        "paragraphs": paragraph_count
    }

def get_top_words(text: str, n: int = 10, min_length: int = 3) -> List[Tuple[str, int]]:
    """
    Get the most frequent words in the text
    """
    # Extract words and convert to lowercase
    words = re.findall(r'\b\w+\b', text.lower())
    
    # Filter out short words and common stopwords
    stopwords = {"the", "and", "to", "of", "a", "in", "for", "is", "on", "that", "by", "this", "with", 
                "be", "are", "as", "an", "it", "not", "or", "from", "at", "was", "but", "have", "you"}
    
    filtered_words = [word for word in words if len(word) >= min_length and word not in stopwords]
    
    # Count word frequencies
    word_counter = Counter(filtered_words)
    
    # Get the n most common words
    return word_counter.most_common(n) 