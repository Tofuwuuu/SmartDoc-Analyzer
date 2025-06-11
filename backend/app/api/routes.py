from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path

from app.services.document_processor import extract_text_from_document
from app.services.ocr_service import perform_ocr
from app.services.sentiment_analyzer import sentiment_analyzer
from app.services.text_summarizer import text_summarizer
from app.services.document_classifier import document_classifier
from app.services.entity_extractor import entity_extractor
from app.models.document import DocumentResponse

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    analysis_type: Optional[str] = Form("text_extraction"),
    ai_analysis: Optional[bool] = Form(False)
):
    """
    Upload a document (PDF or image) for analysis.
    
    - text_extraction: Extract text from document
    - ocr: Perform OCR on document
    - ai_analysis: Enable AI-powered analysis (sentiment, summarization, etc.)
    """
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not supported. Supported types: {', '.join(allowed_types)}"
        )
    
    # Create unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process document
    if analysis_type == "ocr":
        text = await perform_ocr(str(file_path))
    else:  # Default to text extraction
        text = await extract_text_from_document(str(file_path))
    
    # Initialize analysis results
    analysis_results = {}
    
    # Perform AI analysis if requested
    if ai_analysis and text:
        try:
            # Run analyses in parallel
            sentiment_result = await sentiment_analyzer.analyze_sentiment(text)
            summary_result = await text_summarizer.generate_summary(text)
            classification_result = await document_classifier.classify_document(text)
            entities_result = await entity_extractor.extract_entities(text)
            
            # Combine results
            analysis_results = {
                "sentiment": sentiment_result,
                "summary": summary_result,
                "classification": classification_result,
                "entities": entities_result
            }
        except Exception as e:
            analysis_results = {"error": str(e)}
    
    # Return response
    return DocumentResponse(
        filename=file.filename,
        stored_filename=unique_filename,
        file_path=f"/uploads/{unique_filename}",
        file_size=os.path.getsize(file_path),
        content_type=file.content_type,
        text_content=text,
        analysis_type=analysis_type,
        analysis_results=analysis_results
    )

@router.post("/analyze", response_model=DocumentResponse)
async def analyze_document(
    document_id: str = Form(...),
    text_content: str = Form(...),
    analysis_types: Optional[List[str]] = Form(["sentiment", "summary", "classification", "entities"])
):
    """
    Analyze text content with AI models.
    
    - sentiment: Sentiment analysis
    - summary: Text summarization
    - classification: Document classification
    - entities: Named entity recognition
    """
    if not text_content or len(text_content.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Text content too short for analysis"
        )
    
    analysis_results = {}
    
    try:
        # Perform requested analyses
        if "sentiment" in analysis_types:
            analysis_results["sentiment"] = await sentiment_analyzer.analyze_sentiment(text_content)
            
        if "summary" in analysis_types:
            analysis_results["summary"] = await text_summarizer.generate_summary(text_content)
            
        if "classification" in analysis_types:
            analysis_results["classification"] = await document_classifier.classify_document(text_content)
            
        if "entities" in analysis_types:
            analysis_results["entities"] = await entity_extractor.extract_entities(text_content)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing analysis: {str(e)}"
        )
    
    # Return response
    return DocumentResponse(
        filename=f"analysis_{document_id}.txt",
        stored_filename="",
        file_path="",
        file_size=len(text_content),
        content_type="text/plain",
        text_content=text_content,
        analysis_type=",".join(analysis_types),
        analysis_results=analysis_results
    ) 