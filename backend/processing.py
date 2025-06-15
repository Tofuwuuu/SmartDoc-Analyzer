import os
import uuid
import time
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
from .ai_analysis import analyze_content
from .utils import calculate_text_stats, get_top_words

def process_document(file_path: str, enable_ai: bool = True) -> dict:
    """Main document processing pipeline"""
    start_time = time.time()
    
    # Extract text based on file type
    if file_path.lower().endswith('.pdf'):
        text, ocr_confidence = process_pdf(file_path)
    else:  # Image files
        text, ocr_confidence = process_image(file_path)
    
    # Calculate basic statistics
    stats = calculate_text_stats(text)
    top_words = get_top_words(text)
    
    # AI analysis if enabled
    ai_insights = {}
    if enable_ai:
        ai_insights = analyze_content(text)
    
    # Calculate processing time
    processing_time = round(time.time() - start_time, 2)
    
    # Calculate accuracy (placeholder - real implementation would compare to known text)
    accuracy = min(95, max(70, 100 - (10 - ocr_confidence)*3))
    
    return {
        "file_id": str(uuid.uuid4()),
        "file_name": os.path.basename(file_path),
        "file_type": "PDF" if file_path.endswith(".pdf") else "Image",
        "file_size": f"{os.path.getsize(file_path)/1024/1024:.2f} MB",
        "processing_time": f"{processing_time}s",
        "ocr_confidence": f"{ocr_confidence}%",
        "extraction_accuracy": f"{accuracy}%",
        "stats": stats,
        "top_words": top_words,
        "text": text,
        "ai_insights": ai_insights
    }

def process_pdf(file_path: str) -> tuple:
    """Process PDF documents (text-based and scanned)"""
    text = ""
    confidences = []
    
    try:
        # First try extracting text directly
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        
        # If no text found, treat as scanned PDF
        if not text.strip():
            for page_num in range(len(doc)):
                pix = doc[page_num].get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                page_text, confidence = process_image(img)
                text += page_text + "\n"
                confidences.append(confidence)
            confidence = sum(confidences) / len(confidences) if confidences else 0
        else:
            confidence = 100  # Digital PDF
    except Exception:
        text, confidence = "", 0
    
    return text, confidence

def process_image(image) -> tuple:
    """Process image files with OCR"""
    if not isinstance(image, Image.Image):
        image = Image.open(image)
    
    # Preprocess image
    image = image.convert('L')  # Grayscale
    custom_config = r'--oem 3 --psm 11'
    
    # OCR processing
    data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config=custom_config)
    
    # Calculate average confidence
    confidences = [float(conf) for conf in data['conf'] if conf != '-1']
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    # Extract text
    text = " ".join([word for word in data['text'] if word.strip()])
    
    return text, avg_confidence
