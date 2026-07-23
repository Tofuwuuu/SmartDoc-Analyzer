from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deps import get_current_user_optional
from app.models.document import Document, DocumentStatus, Insight
from app.models.user import User
from app.schemas.document import (
    DocumentCreateResponse,
    DocumentListResponse,
    DocumentResponse,
    InsightResponse,
)
from app.services import cache, compliance, file_processing, ml_inference

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> Document:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided")

    content = await file_processing.read_upload_file(file)

    try:
        ext = file_processing.validate_file(file.filename, len(content))
    except file_processing.UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except file_processing.FileTooLargeError as exc:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=str(exc)) from exc

    file_hash = file_processing.compute_file_hash(content)
    stored_path = file_processing.save_upload(content, file.filename)

    document = Document(
        user_id=current_user.id if current_user else None,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_hash=file_hash,
        file_size=len(content),
        file_path=stored_path,
        status=DocumentStatus.PROCESSING.value,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        cached = cache.get_cached_analysis(file_hash)
        if cached is not None:
            extracted_text = cached["extracted_text"]
            analysis = cached["analysis"]
        else:
            extracted_text = file_processing.extract_text(stored_path, ext)
            analysis = ml_inference.analyze_text(extracted_text)
            if compliance.is_likely_contract(extracted_text):
                analysis["document_type"] = "contract"
                analysis["risk_flags"] = compliance.scan_contract(extracted_text)
            else:
                analysis["document_type"] = "general"
                analysis["risk_flags"] = []
            cache.set_cached_analysis(
                file_hash, {"extracted_text": extracted_text, "analysis": analysis}
            )

        document.extracted_text = extracted_text
        document.status = DocumentStatus.COMPLETED.value

        insight = Insight(
            document_id=document.id,
            entities=analysis["entities"],
            summary=analysis["summary"],
            stats=analysis["stats"],
            document_type=analysis.get("document_type", "general"),
            risk_flags=analysis.get("risk_flags", []),
        )
        db.add(insight)
        db.commit()
        db.refresh(document)
    except Exception as exc:  # noqa: BLE001
        document.status = DocumentStatus.FAILED.value
        document.error_message = str(exc)
        db.commit()

    return document


@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> DocumentListResponse:
    query = db.query(Document)
    if current_user:
        query = query.filter(Document.user_id == current_user.id)
    else:
        query = query.filter(Document.user_id.is_(None))

    documents = query.order_by(Document.created_at.desc()).all()
    return DocumentListResponse(items=documents, total=len(documents))


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("/{document_id}/insights", response_model=InsightResponse)
def get_document_insights(document_id: UUID, db: Session = Depends(get_db)) -> Insight:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if document.status == DocumentStatus.PROCESSING.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document is still processing")
    if document.status == DocumentStatus.FAILED.value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=document.error_message or "Document processing failed",
        )
    if document.insight is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insights not found")

    return document.insight
