import fitz  # PyMuPDF
import os
from pathlib import Path


async def extract_text_from_document(file_path: str) -> str:
    """
    Extract text from a PDF document using PyMuPDF
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text content
    """
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Handle PDF files
        if file_ext == '.pdf':
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text += page.get_text()
                
            return text
        
        # For image files, return empty as we'll use OCR service
        elif file_ext in ['.jpg', '.jpeg', '.png', '.tiff', '.tif']:
            return "This is an image file. Use OCR for text extraction."
        
        else:
            return "Unsupported file format for text extraction."
    
    except Exception as e:
        return f"Error extracting text: {str(e)}" 