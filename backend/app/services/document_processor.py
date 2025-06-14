"""
Document processing service that handles document analysis requests.
"""
import os
from fastapi import UploadFile, HTTPException
import aiofiles
import uuid
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import time
import logging
import traceback

from .ocr_service import ocr_service
from .entity_extractor import entity_extractor
from .sentiment_analyzer import sentiment_analyzer
from .text_summarizer import text_summarizer
from .document_classifier import document_classifier

class DocumentProcessor:
    _instance = None
    
    @staticmethod
    def get_instance():
        if DocumentProcessor._instance is None:
            DocumentProcessor._instance = DocumentProcessor()
        return DocumentProcessor._instance
    
    def __init__(self):
        print("Initializing document processor")
        self.uploads_dir = Path("uploads")
        self.uploads_dir.mkdir(exist_ok=True)
        
    async def _save_uploaded_file(self, file: UploadFile) -> Path:
        """Save uploaded file to disk"""
        # Create a unique filename
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = self.uploads_dir / unique_filename
        
        # Save the file
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return file_path
    
    async def _extract_text(self, file_path: Path, analysis_type: str) -> Dict[str, Any]:
        """Extract text from document based on analysis type"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if analysis_type == "text_extraction":
            # Basic text extraction logic
            if file_ext in ['.pdf']:
                text = f"Text extracted from PDF {file_path.name}"
                # In a real implementation, this would use PyMuPDF or similar
                text = f"This is simulated text extraction from {file_path}.\n\n" + \
                       "Text extraction directly accesses document text without OCR.\n\n" + \
                       "Genie Blockchain verification system provides secure and\n" + \
                       "tamper-proof credential verification for alumni data management.\n\n" + \
                       "Implementation of CORD protocol requires proper security analysis."
                       
                return {
                    "text": text,
                    "method": "text_extraction",
                    "file_type": "pdf"
                }
            else:
                # For images, fall back to OCR
                result = await ocr_service.process_image(str(file_path))
                result["method"] = "text_extraction_fallback_to_ocr"
                result["file_type"] = "image"
                return result
        
        elif analysis_type == "ocr":
            # OCR processing
            if file_ext in ['.pdf']:
                result = await ocr_service.process_pdf(str(file_path))
                result["method"] = "ocr_pdf"
                result["file_type"] = "pdf"
                return result
            else:
                result = await ocr_service.process_image(str(file_path))
                result["method"] = "ocr_image"
                result["file_type"] = "image" 
                return result
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported analysis type: {analysis_type}")
    
    async def _analyze_text_with_ai(self, text: str) -> Dict[str, Any]:
        """Perform AI analysis on extracted text"""
        # Run all AI services in parallel (in a real app)
        # For simplicity, we're calling them sequentially
        
        # Extract entities
        entity_results = await entity_extractor.extract_entities(text)
        
        # Analyze sentiment
        sentiment_results = await sentiment_analyzer.analyze_sentiment(text)
        
        # Generate summary
        summary_results = await text_summarizer.summarize_text(text)
        
        # Classify document
        classification_results = await document_classifier.classify_document(text)
        
        # Combine all results
        ai_results = {
            "entities": entity_results,
            "sentiment": sentiment_results,
            "summary": summary_results,
            "classification": classification_results,
            "word_count": len(text.split()),
            "char_count": len(text)
        }
        
        return ai_results
    
    async def process_document(self, file_path, file_type, analysis_type="text_extraction", ai_analysis=False):
        """
        Process a document and extract text content.
        
        Args:
            file_path: Path to the document file
            file_type: MIME type of the file
            analysis_type: Type of analysis to perform (text_extraction or ocr)
            ai_analysis: Whether to perform AI analysis
            
        Returns:
            Dictionary with processing results
        """
        start_time = time.time()
        
        try:
            # Extract text based on analysis type
            if analysis_type == "ocr":
                # Process with OCR
                ocr_result = await self.ocr_service.process_image(file_path)
                text_content = ocr_result["text"]
                confidence_metrics = ocr_result.get("confidence_metrics", {})
                processing_metrics = ocr_result.get("metrics", {})
            else:
                # Direct text extraction
                if file_type.startswith('image/'):
                    # For images, default to OCR
                    ocr_result = await self.ocr_service.process_image(file_path)
                    text_content = ocr_result["text"]
                    confidence_metrics = ocr_result.get("confidence_metrics", {})
                    processing_metrics = ocr_result.get("metrics", {})
                elif file_type == 'application/pdf':
                    # Extract text from PDF
                    pdf_result = await self.ocr_service.process_pdf(file_path)
                    text_content = pdf_result["text"]
                    confidence_metrics = pdf_result.get("confidence_metrics", {})
                    processing_metrics = pdf_result.get("metrics", {})
                else:
                    # For other file types, extract text directly
                    with open(file_path, 'r', encoding='utf-8') as file:
                        text_content = file.read()
                    confidence_metrics = {
                        "overall_confidence": 0.95,
                        "character_confidence": {
                            "average": 0.95,
                            "min": 0.90,
                            "max": 1.0
                        }
                    }
                    processing_metrics = {}
            
            # Calculate total processing time
            processing_time = time.time() - start_time
            processing_metrics["processing_time"] = round(processing_time, 2)
            
            # Store file info
            file_info = {
                "path": file_path,
                "type": file_type,
                "size": os.path.getsize(file_path)
            }
            
            # Prepare result object
            result = {
                "text_content": text_content,
                "file_info": file_info,
                "confidence_metrics": confidence_metrics,
                "metrics": processing_metrics
            }
            
            # Perform AI analysis if requested
            if ai_analysis:
                ai_data = await self._analyze_text_with_ai(text_content)
                result["analysis_results"] = ai_data
            
            return result
            
        except Exception as e:
            logging.error(f"Error processing document: {str(e)}")
            traceback.print_exc()
            raise DocumentProcessingException(f"Error processing document: {str(e)}")

# Get the singleton instance
document_processor = DocumentProcessor.get_instance() 