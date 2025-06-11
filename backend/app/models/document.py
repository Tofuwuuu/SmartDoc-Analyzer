from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class DocumentResponse(BaseModel):
    """Response model for document uploads and analysis"""
    filename: str
    stored_filename: str
    file_path: str
    file_size: int
    content_type: str
    text_content: str
    analysis_type: str
    analysis_results: Optional[Dict[str, Any]] = None 