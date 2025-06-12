from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from typing import List, Optional
import os
import uuid
import shutil
from pathlib import Path
import time
from sqlalchemy.orm import Session

from app.services.document_processor import extract_text_from_document
from app.services.ocr_service import perform_ocr
from app.services.sentiment_analyzer import sentiment_analyzer
from app.services.text_summarizer import text_summarizer
from app.services.document_classifier import document_classifier
from app.services.entity_extractor import entity_extractor
from app.models.document import DocumentResponse
from app.db.database import get_db
from app.db.crud import (
    get_file_hash, 
    get_analysis_by_hash,
    create_analysis_cache,
    update_analysis_cache,
    create_processing_job,
    update_job_status,
    log_performance_metric
)
from app.db.models import ProcessingStatus

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    analysis_type: Optional[str] = Form("text_extraction"),
    ai_analysis: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
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
    file_content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    # Reset file pointer
    await file.seek(0)
    
    # Calculate file hash
    file_hash = get_file_hash(file_content)
    
    # Check if we already have results for this file
    cached_analysis = get_analysis_by_hash(db, file_hash)
    if cached_analysis and cached_analysis.ocr_text:
        return DocumentResponse(
            filename=file.filename,
            stored_filename=unique_filename,
            file_path=f"/uploads/{unique_filename}",
            file_size=os.path.getsize(file_path),
            content_type=file.content_type,
            text_content=cached_analysis.ocr_text,
            analysis_type=analysis_type,
            analysis_results={
                "sentiment": cached_analysis.sentiment,
                "entities": cached_analysis.entities,
                "summary": cached_analysis.summary,
                "classification": cached_analysis.classification
            }
        )
    
    # Create database entry for the file
    db_analysis = create_analysis_cache(
        db,
        file_hash=file_hash,
        filename=file.filename,
        file_type=file.content_type,
        file_size=os.path.getsize(file_path),
        storage_path=str(file_path)
    )
    
    # Create processing job
    job = create_processing_job(db, file_hash)
    
    # Process document
    start_time = time.time()
    if analysis_type == "ocr":
        update_job_status(db, job.id, "PROCESSING", ProcessingStatus.OCR.value)
        text = await perform_ocr(str(file_path))
    else:  # Default to text extraction
        update_job_status(db, job.id, "PROCESSING", ProcessingStatus.PREPROCESSING.value)
        text = await extract_text_from_document(str(file_path))
    
    # Log processing time
    processing_time = int((time.time() - start_time) * 1000)  # in milliseconds
    log_performance_metric(
        db, 
        job_id=job.id, 
        stage=ProcessingStatus.OCR.value if analysis_type == "ocr" else ProcessingStatus.PREPROCESSING.value,
        file_type=file.content_type,
        duration_ms=processing_time,
        file_size=os.path.getsize(file_path)
    )
    
    # Update cache with text content
    update_analysis_cache(db, file_hash, ocr_text=text)
    
    # Initialize analysis results
    analysis_results = {}
    
    # Perform AI analysis if requested
    if ai_analysis and text:
        update_job_status(db, job.id, "PROCESSING", ProcessingStatus.AI_ANALYSIS.value)
        start_time = time.time()
        
        try:
            # Run analyses
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
            
            # Update cache with analysis results
            update_analysis_cache(
                db,
                file_hash,
                sentiment=sentiment_result,
                summary=summary_result,
                classification=classification_result,
                entities=entities_result
            )
            
        except Exception as e:
            analysis_results = {"error": str(e)}
            update_job_status(
                db, 
                job.id, 
                "ERROR", 
                ProcessingStatus.ERROR.value, 
                error_message=str(e)
            )
            
        # Log AI processing time
        ai_processing_time = int((time.time() - start_time) * 1000)  # in milliseconds
        log_performance_metric(
            db, 
            job_id=job.id, 
            stage=ProcessingStatus.AI_ANALYSIS.value,
            file_type=file.content_type,
            duration_ms=ai_processing_time
        )
    
    # Mark job as completed
    update_job_status(db, job.id, "COMPLETED", ProcessingStatus.COMPLETED.value)
    
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
    analysis_types: Optional[List[str]] = Form(["sentiment", "summary", "classification", "entities"]),
    db: Session = Depends(get_db)
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
    
    # Calculate hash of text content
    content_hash = get_file_hash(text_content.encode('utf-8'))
    
    # Check cache
    cached_analysis = get_analysis_by_hash(db, content_hash)
    if cached_analysis and cached_analysis.sentiment and cached_analysis.entities:
        return DocumentResponse(
            filename=f"analysis_{document_id}.txt",
            stored_filename="",
            file_path="",
            file_size=len(text_content),
            content_type="text/plain",
            text_content=text_content,
            analysis_type=",".join(analysis_types),
            analysis_results={
                "sentiment": cached_analysis.sentiment if "sentiment" in analysis_types else None,
                "summary": cached_analysis.summary if "summary" in analysis_types else None,
                "classification": cached_analysis.classification if "classification" in analysis_types else None,
                "entities": cached_analysis.entities if "entities" in analysis_types else None,
            }
        )
    
    # Create cache entry
    create_analysis_cache(
        db,
        file_hash=content_hash,
        filename=f"analysis_{document_id}.txt",
        file_type="text/plain",
        file_size=len(text_content)
    )
    
    # Create job
    job = create_processing_job(db, content_hash)
    update_job_status(db, job.id, "PROCESSING", ProcessingStatus.AI_ANALYSIS.value)
    
    start_time = time.time()
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
        
        # Update cache
        update_analysis_cache(
            db,
            content_hash,
            ocr_text=text_content,
            sentiment=analysis_results.get("sentiment"),
            summary=analysis_results.get("summary"),
            classification=analysis_results.get("classification"),
            entities=analysis_results.get("entities")
        )
        
        # Mark job complete
        update_job_status(db, job.id, "COMPLETED", ProcessingStatus.COMPLETED.value)
    
    except Exception as e:
        update_job_status(
            db, 
            job.id, 
            "ERROR", 
            ProcessingStatus.ERROR.value, 
            error_message=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error performing analysis: {str(e)}"
        )
    
    # Log processing time
    processing_time = int((time.time() - start_time) * 1000)  # in milliseconds
    log_performance_metric(
        db, 
        job_id=job.id, 
        stage=ProcessingStatus.AI_ANALYSIS.value,
        file_type="text/plain",
        duration_ms=processing_time,
        file_size=len(text_content)
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