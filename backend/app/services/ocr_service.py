import pytesseract
from PIL import Image
import os
import fitz  # PyMuPDF
import tempfile
from pathlib import Path


async def perform_ocr(file_path: str) -> str:
    """
    Perform OCR on an image or PDF document
    
    Args:
        file_path: Path to the image or PDF file
        
    Returns:
        Extracted text content
    """
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Handle image files directly
        if file_ext in ['.jpg', '.jpeg', '.png', '.tif', '.tiff']:
            img = Image.open(file_path)
            text = pytesseract.image_to_string(img)
            return text
        
        # Handle PDF files by converting to images first
        elif file_ext == '.pdf':
            doc = fitz.open(file_path)
            text = ""
            
            # Create temporary directory for page images
            with tempfile.TemporaryDirectory() as temp_dir:
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    pix = page.get_pixmap()
                    
                    # Save image
                    img_path = os.path.join(temp_dir, f"page_{page_num}.png")
                    pix.save(img_path)
                    
                    # OCR the image
                    img = Image.open(img_path)
                    page_text = pytesseract.image_to_string(img)
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            return text
        
        else:
            return "Unsupported file format for OCR."
    
    except Exception as e:
        return f"Error performing OCR: {str(e)}" 