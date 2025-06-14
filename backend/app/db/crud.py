from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
import json

from .models import AnalysisCache, ProcessingJob, PerformanceMetric, ProcessingStatus

# Analysis Cache operations
def get_analysis_by_hash(db: Session, file_hash: str, analysis_type: str = None):
    """Get analysis results by file hash and analysis type if it exists in cache"""
    query = db.query(AnalysisCache).filter(AnalysisCache.file_hash == file_hash)
    
    if analysis_type:
        query = query.filter(AnalysisCache.analysis_type == analysis_type)
        
    return query.first()

def create_analysis_cache(db: Session, file_hash: str, filename: str, file_type: str, file_size: int, storage_path: str = None, analysis_type: str = None, ocr_text: str = None):
    """Create a new analysis cache entry"""
    # Set expiry time to 24 hours from now
    expiry_time = datetime.utcnow() + timedelta(hours=24)
    
    db_analysis = AnalysisCache(
        file_hash=file_hash,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        analysis_type=analysis_type,
        ocr_text=ocr_text,
        expiry_time=expiry_time
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

def update_analysis_cache(db: Session, file_hash: str, analysis_type: str = None, **kwargs):
    """Update analysis cache with results"""
    db_analysis = get_analysis_by_hash(db, file_hash, analysis_type)
    if db_analysis:
        for key, value in kwargs.items():
            # Convert dictionaries and objects to JSON strings for database storage
            if isinstance(value, (dict, list)) or key in ['sentiment', 'entities', 'summary', 'classification']:
                try:
                    setattr(db_analysis, key, json.dumps(value))
                except (TypeError, ValueError):
                    # If we can't JSON serialize, convert to string representation
                    setattr(db_analysis, key, str(value))
            else:
                setattr(db_analysis, key, value)
        db.commit()
        db.refresh(db_analysis)
    return db_analysis

def cleanup_expired_cache(db: Session):
    """Delete expired cache entries"""
    now = datetime.utcnow()
    expired = db.query(AnalysisCache).filter(AnalysisCache.expiry_time < now).all()
    for entry in expired:
        db.delete(entry)
    db.commit()
    return len(expired)

# Processing Job operations
def create_processing_job(db: Session, file_hash: str, analysis_type: str = "text_extraction"):
    """Create a new processing job"""
    db_job = ProcessingJob(
        file_hash=file_hash,
        analysis_type=analysis_type,
        status="PROCESSING",
        current_stage=ProcessingStatus.UPLOADED.value
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def update_job_status(db: Session, job_id: str, status: str, stage: str, error_message: str = None, error_trace: str = None):
    """Update job status and stage"""
    db_job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if db_job:
        db_job.status = status
        db_job.current_stage = stage
        db_job.error_message = error_message
        db_job.error_trace = error_trace
        
        if status == "COMPLETED":
            db_job.completed_at = datetime.utcnow()
            
        db.commit()
        db.refresh(db_job)
    return db_job

# Performance metrics operations
def log_performance_metric(db: Session, job_id: str, stage: str, file_type: str, duration_ms: int, file_size: int = None, confidence_score: int = None):
    """Log performance metric for a processing stage"""
    db_metric = PerformanceMetric(
        job_id=job_id,
        stage=stage,
        file_type=file_type,
        file_size=file_size,
        duration_ms=duration_ms,
        confidence_score=confidence_score
    )
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

# File operations
def get_file_hash(file_content: bytes) -> str:
    """Calculate SHA-256 hash of file content"""
    return hashlib.sha256(file_content).hexdigest() 