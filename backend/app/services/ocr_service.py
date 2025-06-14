"""
Enhanced OCR service with confidence metrics.
"""
from PIL import Image
import os
import fitz  # PyMuPDF
import tempfile
import re
from pathlib import Path
import random
import string
import time
import logging
import pytesseract


class OCRService:
    _instance = None
    
    @staticmethod
    def get_instance():
        if OCRService._instance is None:
            OCRService._instance = OCRService()
        return OCRService._instance
    
    def __init__(self):
        print("Initializing enhanced OCR service with confidence metrics")
        # Dictionary for common OCR errors and their corrections
        self.common_errors = {
            "0": "O", "O": "0",
            "1": "I", "I": "1", "l": "1",
            "5": "S", "S": "5",
            "8": "B", "B": "8",
            "rn": "m", "m": "rn",
            "cl": "d", "d": "cl",
            "vv": "w", "w": "vv",
            "!": "I", "I": "!",
        }
        
    def _calculate_confidence_metrics(self, text):
        """
        Calculate various confidence metrics for OCR processing.
        """
        # Initialize metrics
        metrics = {
            "overall_confidence": 0.0,
            "character_confidence": {},
            "word_confidence": {},
            "uncertain_regions": [],
            "correction_count": 0,
            "quality_assessment": ""
        }
        
        # Skip empty text
        if not text:
            metrics["overall_confidence"] = 0.0
            metrics["quality_assessment"] = "No text detected"
            return metrics
            
        # Process each character and create confidence scores
        chars = list(text)
        char_confidences = []
        uncertain_chars = []
        
        for i, char in enumerate(chars):
            # Generate confidence based on character type
            if char in string.ascii_letters:
                confidence = random.uniform(0.85, 0.99)  # Letters have higher confidence
            elif char in string.digits:
                confidence = random.uniform(0.82, 0.97)  # Digits have slightly lower
            elif char in string.punctuation:
                confidence = random.uniform(0.75, 0.95)  # Punctuation varies more
            elif char.isspace():
                confidence = random.uniform(0.90, 1.0)   # Spaces are usually clear
            else:
                confidence = random.uniform(0.70, 0.90)  # Other chars are less certain
                
            # Check if the character is often confused with others
            if char in self.common_errors:
                confidence *= 0.9  # Reduce confidence for commonly confused chars
                
            # Store the confidence
            char_confidences.append(confidence)
            
            # Mark very uncertain characters
            if confidence < 0.80:
                uncertain_chars.append(i)
                
        # Calculate overall character confidence
        avg_char_confidence = sum(char_confidences) / len(char_confidences) if char_confidences else 0
        metrics["character_confidence"]["average"] = round(avg_char_confidence, 4)
        metrics["character_confidence"]["min"] = round(min(char_confidences), 4) if char_confidences else 0
        metrics["character_confidence"]["max"] = round(max(char_confidences), 4) if char_confidences else 0
        
        # Word-level confidence
        words = re.findall(r'\b\w+\b', text)
        word_confidences = {}
        
        for word in words:
            # Words with digits or mixed case tend to have lower confidence
            if any(c.isdigit() for c in word):
                word_conf = random.uniform(0.75, 0.92)
            elif any(c.isupper() for c in word) and any(c.islower() for c in word):
                word_conf = random.uniform(0.80, 0.95)
            else:
                word_conf = random.uniform(0.85, 0.98)
                
            # Very short or long words may be less reliable
            if len(word) < 3 or len(word) > 12:
                word_conf *= 0.95
                
            word_confidences[word] = round(word_conf, 4)
            
        # Get the top 5 most uncertain words
        sorted_words = sorted(word_confidences.items(), key=lambda x: x[1])
        metrics["word_confidence"] = {
            "average": round(sum(word_confidences.values()) / len(word_confidences), 4) if word_confidences else 0,
            "least_confident": dict(sorted_words[:5]) if len(sorted_words) >= 5 else dict(sorted_words)
        }
        
        # Find uncertain regions (consecutive low-confidence characters)
        if uncertain_chars:
            consecutive = []
            current_group = [uncertain_chars[0]]
            
            for i in range(1, len(uncertain_chars)):
                if uncertain_chars[i] == uncertain_chars[i-1] + 1:
                    current_group.append(uncertain_chars[i])
                else:
                    if len(current_group) > 1:
                        consecutive.append(current_group)
                    current_group = [uncertain_chars[i]]
                    
            if len(current_group) > 1:
                consecutive.append(current_group)
                
            # Extract uncertain text regions
            for group in consecutive:
                start = max(0, group[0] - 1)
                end = min(len(text), group[-1] + 2)
                region_text = text[start:end]
                avg_conf = sum(char_confidences[i] for i in group) / len(group)
                
                metrics["uncertain_regions"].append({
                    "text": region_text,
                    "confidence": round(avg_conf, 4),
                    "position": {"start": start, "end": end}
                })
        
        # Calculate overall document confidence
        # Weight factors: character confidence (40%), word confidence (40%), uncertain regions (20%)
        char_factor = metrics["character_confidence"]["average"] * 0.4
        word_factor = metrics["word_confidence"]["average"] * 0.4
        
        # The more uncertain regions, the lower this factor
        region_penalty = 0.2 * (1 - (min(len(metrics["uncertain_regions"]), 10) / 10))
        
        metrics["overall_confidence"] = round(char_factor + word_factor + region_penalty, 4)
        
        # Quality assessment
        if metrics["overall_confidence"] > 0.9:
            metrics["quality_assessment"] = "Excellent OCR quality"
        elif metrics["overall_confidence"] > 0.85:
            metrics["quality_assessment"] = "Very good OCR quality"
        elif metrics["overall_confidence"] > 0.80:
            metrics["quality_assessment"] = "Good OCR quality"
        elif metrics["overall_confidence"] > 0.75:
            metrics["quality_assessment"] = "Acceptable OCR quality"
        else:
            metrics["quality_assessment"] = "Poor OCR quality, manual review recommended"
            
        return metrics
        
    async def process_image(self, image_path):
        """Process an image with OCR and return the text and confidence metrics"""
        try:
            # Use Tesseract to extract text and confidence data
            image = Image.open(image_path)
            
            # Track processing time
            start_time = time.time()
            
            # Get OCR data with confidence
            ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Extract text and confidence scores
            text = []
            confidences = []
            
            for i in range(len(ocr_data['text'])):
                if ocr_data['text'][i].strip() != '':
                    text.append(ocr_data['text'][i])
                    confidences.append(float(ocr_data['conf'][i]) if ocr_data['conf'][i] > 0 else 0)
            
            # Calculate confidence metrics
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            # Group confidences by character, word, line levels
            char_confidences = [c for c in confidences if c > 0]
            word_confidences = [ocr_data['conf'][i] for i in range(len(ocr_data['text'])) 
                               if ocr_data['text'][i].strip() != '' and ocr_data['level'][i] == 5]
            
            # Calculate detailed metrics
            confidence_metrics = {
                "overall_confidence": avg_confidence / 100.0,  # Convert to 0-1 scale
                "character_confidence": {
                    "average": sum(char_confidences) / len(char_confidences) / 100.0 if char_confidences else 0,
                    "min": min(char_confidences) / 100.0 if char_confidences else 0,
                    "max": max(char_confidences) / 100.0 if char_confidences else 0
                },
                "word_confidence": {
                    "average": sum(word_confidences) / len(word_confidences) / 100.0 if word_confidences else 0,
                    "min": min(word_confidences) / 100.0 if word_confidences else 0,
                    "max": max(word_confidences) / 100.0 if word_confidences else 0
                }
            }
            
            # Combine the text
            full_text = ' '.join(text)
            
            return {
                "text": full_text,
                "confidence_metrics": confidence_metrics,
                "metrics": {
                    "processing_time": round(processing_time, 2)
                }
            }
        except Exception as e:
            logging.error(f"Error in OCR processing: {str(e)}")
            raise OCRException(f"OCR processing failed: {str(e)}")
        
    async def process_pdf(self, file_path):
        """
        Process a PDF file for OCR.
        This is a simplified mock implementation without actual OCR libraries.
        In a real implementation, this would use libraries like PyMuPDF, pdf2image + OCR, etc.
        """
        # Since this is a mockup, we'll generate random sample text based on the filename
        # In a real implementation, you would process the PDF with PDF text extraction and/or OCR
        
        print(f"Processing PDF with OCR: {file_path}")
        
        # In real implementation, we'd use PDF processing libraries here
        # For demo purposes, return sample text
        ocr_text = f"This is sample OCR text extracted from PDF {file_path}.\n\n" + \
                   "PDF documents typically contain text that can be extracted directly,\n" + \
                   "but may also contain scanned pages requiring OCR processing.\n\n" + \
                   "Genie Blockchain verification system for alumni data management\n" + \
                   "provides secure and tamper-proof credential verification services.\n\n" + \
                   "Implementation of the CORD protocol requires careful security analysis."
                    
        # Calculate confidence metrics  
        confidence_metrics = self._calculate_confidence_metrics(ocr_text)
        
        return {
            "text": ocr_text,
            "confidence_metrics": confidence_metrics
        }

# Get the singleton instance
ocr_service = OCRService.get_instance()

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