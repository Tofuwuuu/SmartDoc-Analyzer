from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EntityItem(BaseModel):
    text: str
    label: str
    count: int = 1


class RiskFlag(BaseModel):
    type: str
    severity: str
    title: str
    description: str
    evidence: str | None = None


class DocumentCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    content_type: str
    file_size: int
    file_hash: str
    status: str
    created_at: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    filename: str
    content_type: str
    file_size: int
    file_hash: str
    status: str
    extracted_text: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int


class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    entities: list[EntityItem] = Field(default_factory=list)
    summary: str
    stats: dict = Field(default_factory=dict)
    document_type: str = "general"
    risk_flags: list[RiskFlag] = Field(default_factory=list)
    created_at: datetime
