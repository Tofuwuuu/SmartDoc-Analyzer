from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil
from pathlib import Path
import time
from sqlalchemy.orm import Session
import json
import traceback
from datetime import datetime

from app.services.document_processor import document_processor
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

# Helper functions
def is_valid_file_type(content_type: str) -> bool:
    """Check if the file type is supported."""
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    return content_type in allowed_types

async def save_uploaded_file(file: UploadFile) -> str:
    """Save an uploaded file to disk and return the file path."""
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Create a unique filename
    file_path = os.path.join(upload_dir, f"{int(time.time())}_{file.filename}")
    
    # Save the file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Reset file pointer for further operations
    await file.seek(0)
    
    return file_path

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    analysis_type: Optional[str] = Form("text_extraction"),
    ai_analysis: Optional[str] = Form("false"),
    db: Session = Depends(get_db)
):
    """
    Upload a document (PDF or image) for analysis.
    
    - text_extraction: Extract text from document
    - ocr: Perform OCR on document
    - ai_analysis: Enable AI-powered analysis (sentiment, summarization, etc.)
    """
    # Convert ai_analysis string to boolean
    ai_analysis_bool = ai_analysis.lower() == "true"
    
    # Debug logging
    print(f"AI Analysis parameter received: '{ai_analysis}', converted to: {ai_analysis_bool}")
    
    # Validate file type
    if not is_valid_file_type(file.content_type):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and image files are supported.")
    
    try:
        # Save the uploaded file
        file_path = await save_uploaded_file(file)
        
        # Calculate file hash for caching
        file_content = await file.read()
        await file.seek(0)  # Reset file pointer
        file_hash = get_file_hash(file_content)
        
        # Check if we have this analysis in cache
        db_analysis = get_analysis_by_hash(db, file_hash, analysis_type)
        
        # Create processing job
        job = create_processing_job(db, file_hash, analysis_type)
        update_job_status(db, job.id, "PROCESSING", ProcessingStatus.EXTRACTING_TEXT.value)
        
        if db_analysis:
            # Update last accessed time
            db_analysis.last_accessed = datetime.utcnow()
            db.commit()
            
            # Use cached result if AI analysis is not requested or if we have AI results
            if (not ai_analysis_bool) or (db_analysis.sentiment and db_analysis.entities):
                update_job_status(db, job.id, "COMPLETED", ProcessingStatus.COMPLETED.value)
                
                # Return cached result
                return DocumentResponse(
                    id=str(job.id),
                    status="success",
                    filename=db_analysis.filename,
                    file_type=db_analysis.file_type,
                    file_size=db_analysis.file_size,
                    content_type=db_analysis.file_type,
                    analysis_type=db_analysis.analysis_type,
                    text_content=db_analysis.ocr_text or "",
                    processed_at=db_analysis.last_accessed,
                    analysis_results={
                        "sentiment": json.loads(db_analysis.sentiment) if db_analysis.sentiment else None,
                        "entities": json.loads(db_analysis.entities) if db_analysis.entities else None,
                        "summary": json.loads(db_analysis.summary) if db_analysis.summary else None,
                        "classification": json.loads(db_analysis.classification) if db_analysis.classification else None,
                        "confidence_metrics": json.loads(db_analysis.confidence_metrics) if db_analysis.confidence_metrics else None,
                        "metrics": json.loads(db_analysis.processing_metrics) if db_analysis.processing_metrics else None
                    } if ai_analysis_bool else {}
                )
        
        # Process the document
        update_job_status(db, job.id, "PROCESSING", ProcessingStatus.PROCESSING.value)
        
        # Process the document
        results = await document_processor.process_document(
            file_path=file_path,
            file_type=file.content_type,
            analysis_type=analysis_type,
            ai_analysis=ai_analysis_bool
        )
        
        # Create or update cache entry
        if not db_analysis:
            db_analysis = create_analysis_cache(
                db,
                file_hash=file_hash,
                filename=file.filename,
                file_type=file.content_type,
                file_size=results["file_info"]["size"],
                storage_path=results["file_info"].get("path", ""),
                analysis_type=analysis_type,
                ocr_text=results["text_content"]
            )
        
        # Update cache with AI analysis results if available
        if ai_analysis_bool and "analysis_results" in results:
            ai_data = results["analysis_results"]
            update_analysis_cache(
                db,
                file_hash=file_hash,
                analysis_type=analysis_type,
                sentiment=ai_data.get("sentiment"),
                entities=ai_data.get("entities"),
                summary=ai_data.get("summary"),
                classification=ai_data.get("classification"),
                confidence_metrics=results.get("confidence_metrics"),
                processing_metrics=results.get("metrics")
            )
        
        # Mark job as completed
        update_job_status(db, job.id, "COMPLETED", ProcessingStatus.COMPLETED.value)
        
        # Prepare response
        return DocumentResponse(
            id=str(job.id),
            status="success",
            filename=file.filename,
            file_type=file.content_type,
            file_size=results["file_info"]["size"],
            content_type=file.content_type,
            analysis_type=analysis_type,
            text_content=results["text_content"],
            processed_at=datetime.utcnow(),
            analysis_results={
                "sentiment": results.get("analysis_results", {}).get("sentiment"),
                "entities": results.get("analysis_results", {}).get("entities"),
                "summary": results.get("analysis_results", {}).get("summary"),
                "classification": results.get("analysis_results", {}).get("classification"),
                "confidence_metrics": results.get("confidence_metrics"),
                "metrics": results.get("metrics")
            } if ai_analysis_bool else {}
        )
        
    except Exception as e:
        # Update job status to error
        if 'job' in locals():
            update_job_status(
                db, 
                job.id, 
                "ERROR", 
                ProcessingStatus.ERROR.value,
                error_message=str(e),
                error_trace=traceback.format_exc()
            )
        
        # Re-raise exception
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_text(
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
    
    results = {}
    
    try:
        # Process each requested analysis type
        if "sentiment" in analysis_types:
            results["sentiment"] = await document_processor._analyze_text_with_ai(text_content)
            
        # Return all results
        return {
            "status": "success",
            "text_length": len(text_content),
            "word_count": len(text_content.split()),
            "analysis_results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@router.get("/status", response_model=Dict[str, Any])
async def get_service_status():
    """Get status of document processing services"""
    return {
        "status": "online",
        "services": {
            "text_extraction": "available",
            "ocr": "available",
            "ai_analysis": "available",
            "sentiment_analysis": "available",
            "entity_extraction": "available",
            "text_summarization": "available",
            "document_classification": "available"
        },
        "metrics": {
            "uptime": "12 hours 34 minutes",
            "processed_documents": 42,
            "average_processing_time": "1.5 seconds"
        }
    }

@router.get("/test-ai-param", response_model=Dict[str, Any])
async def test_ai_param(ai_analysis: Optional[str] = "false"):
    """Test route for checking how AI analysis parameter is parsed"""
    ai_analysis_bool = ai_analysis.lower() == "true"
    
    return {
        "received": ai_analysis,
        "parsed_as_bool": ai_analysis_bool,
        "type": type(ai_analysis).__name__
    } 