from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
import uuid
import enum

from .database import Base

class ProcessingStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    PREPROCESSING = "PREPROCESSING"
    OCR = "OCR"
    AI_ANALYSIS = "AI_ANALYSIS"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"

class AnalysisCache(Base):
    __tablename__ = "analysis_cache"
    
    file_hash = Column(String(64), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(255))
    ocr_text = Column(Text, nullable=True)
    sentiment = Column(JSON, nullable=True)
    entities = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    classification = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    last_accessed = Column(DateTime, onupdate=func.now())
    expiry_time = Column(DateTime, nullable=True)
    
class ProcessingJob(Base):
    __tablename__ = "processing_jobs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_hash = Column(String(64), ForeignKey("analysis_cache.file_hash"), index=True)
    status = Column(String(20), nullable=False)
    current_stage = Column(String(20), nullable=False)
    error_message = Column(Text, nullable=True)
    error_trace = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)

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