"""
Simplified OCR service that doesn't require Tesseract to be installed.
"""
from PIL import Image
import os
import fitz  # PyMuPDF
import tempfile
import re
from pathlib import Path


async def perform_ocr(file_path: str) -> str:
    """
    Simplified OCR simulation for demonstration purposes.
    For PDFs, it extracts text using PyMuPDF directly.
    For images, it returns a placeholder message.
    
    Args:
        file_path: Path to the image or PDF file
        
    Returns:
        Extracted text content or placeholder
    """
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Handle image files with placeholder
        if file_ext in ['.jpg', '.jpeg', '.png', '.tif', '.tiff']:
            return f"""
            [IMAGE OCR SIMULATION]
            This is a simulated OCR result because Tesseract is not installed.
            
            To install Tesseract OCR:
            - Windows: Download and install from https://github.com/UB-Mannheim/tesseract/wiki
            - macOS: Use Homebrew with 'brew install tesseract'
            - Linux: Use 'apt-get install tesseract-ocr' or equivalent
            
            Image Details:
            - File: {os.path.basename(file_path)}
            - Size: {os.path.getsize(file_path) / 1024:.1f} KB
            """
        
        # Handle PDF files by extracting text directly via PyMuPDF
        elif file_ext == '.pdf':
            doc = fitz.open(file_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            if not text.strip():
                text = f"""
                [PDF TEXT EXTRACTION]
                No extractable text found in this PDF. It may contain scanned images.
                
                To enable full OCR:
                - Install Tesseract OCR (see README)
                - Make sure it's in your system PATH
                
                PDF Details:
                - File: {os.path.basename(file_path)}
                - Pages: {len(doc)}
                - Size: {os.path.getsize(file_path) / 1024:.1f} KB
                """
            
            return text
        
        else:
            return "Unsupported file format for text extraction."
    
    except Exception as e:
        return f"Error processing file: {str(e)}" 