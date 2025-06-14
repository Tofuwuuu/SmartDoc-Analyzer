from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON, PrimaryKeyConstraint, ForeignKeyConstraint
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from .database import Base

class ProcessingStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    PREPROCESSING = "PREPROCESSING"
    OCR = "OCR"
    AI_ANALYSIS = "AI_ANALYSIS"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"

class AnalysisCache(Base):
    """Cache for document analysis results"""
    __tablename__ = "analysis_cache"
    
    file_hash = Column(String, primary_key=True)
    analysis_type = Column(String, primary_key=True)
    filename = Column(String)
    file_type = Column(String)
    file_size = Column(Integer)
    storage_path = Column(String, nullable=True)
    ocr_text = Column(Text, nullable=True)
    sentiment = Column(Text, nullable=True)
    entities = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    classification = Column(Text, nullable=True)
    confidence_metrics = Column(Text, nullable=True)
    processing_metrics = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    expiry_time = Column(DateTime)
    
    # Define a composite primary key
    __table_args__ = (
        PrimaryKeyConstraint(file_hash, analysis_type),
    )
    
class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_hash = Column(String(64), index=True)
    analysis_type = Column(String(50), nullable=False, default="text_extraction")
    status = Column(String(20), nullable=False)
    current_stage = Column(String(20), nullable=False)
    error_message = Column(Text, nullable=True)
    error_trace = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Use ForeignKeyConstraint to reference the composite key
    __table_args__ = (
        ForeignKeyConstraint(
            ['file_hash', 'analysis_type'],
            ['analysis_cache.file_hash', 'analysis_cache.analysis_type'],
        ),
    )

class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("processing_jobs.id"), nullable=True)
    stage = Column(String(20), nullable=False, index=True)
    file_type = Column(String(10), nullable=False, index=True)
    file_size = Column(Integer, nullable=True)
    duration_ms = Column(Integer, nullable=False)
    confidence_score = Column(Integer, nullable=True)
    timestamp = Column(DateTime, server_default=func.now()) 