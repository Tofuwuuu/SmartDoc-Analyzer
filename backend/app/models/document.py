from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DocumentResponse(BaseModel):
    """Response model for document uploads and analysis"""
    filename: str
    file_hash: str
    file_size: int
    content_type: str
    text_content: str
    analysis_type: str
    analysis_results: Optional[Dict[str, Any]] = None
    
    
class ConfidenceMetrics(BaseModel):
    """Model for OCR confidence metrics"""
    overall_confidence: float
    character_confidence: Dict[str, float]
    word_confidence: Dict[str, Any]
    uncertain_regions: Optional[List[Dict[str, Any]]] = None
    quality_assessment: str


class EntityExtraction(BaseModel):
    """Model for entity extraction results"""
    message: str
    entities: Dict[str, List[str]]
    positions: Optional[List[Dict[str, Any]]] = None
    

class SentimentAnalysis(BaseModel):
    """Model for sentiment analysis results"""
    label: str
    score: float
    confidence: Optional[float] = None
    method: str
    message: Optional[str] = None
    distribution: Optional[Dict[str, float]] = None
    sentences: Optional[List[Dict[str, Any]]] = None


class DocumentClassification(BaseModel):
    """Model for document classification results"""
    top_category: str
    confidence: float
    scores: Dict[str, float]
    message: str


class TextSummary(BaseModel):
    """Model for text summarization results"""
    summary: str
    original_length: Optional[int] = None
    summary_length: Optional[int] = None
    compression_ratio: Optional[int] = None
    keywords: Optional[Dict[str, float]] = None
    message: str


class AIAnalysisResults(BaseModel):
    """Model for AI analysis results"""
    sentiment: Optional[SentimentAnalysis] = None
    entities: Optional[EntityExtraction] = None
    summary: Optional[TextSummary] = None
    classification: Optional[DocumentClassification] = None
    word_count: int
    char_count: int
    confidence_metrics: Optional[ConfidenceMetrics] = None 