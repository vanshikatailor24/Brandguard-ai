"""
backend/app/api/routes/documents.py
REST API endpoints for Policy & Brand Document Management and Candidate Rule Extraction.

Safety:
  - Validates file type (.txt, .pdf, .docx), size (max 10MB), and magic headers.
  - Automatically parses text and discovers candidate brand rules.
  - Extracted rules are marked draft/unapproved (human approval required).
"""
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.source_document import SourceDocument
from app.models.brand_rule import BrandRule
from app.schemas.document import (
    SourceDocumentOut,
    DocumentListResponse,
    DocumentUploadResponse,
    CandidateRuleOut,
)
from app.services.document_service import (
    validate_document_file,
    extract_text_from_document,
    extract_candidate_rules_from_text,
)

router = APIRouter(tags=["Documents"])


@router.get("/documents", response_model=DocumentListResponse)
def list_documents(
    company_id: int | None = Query(None, description="Filter by company ID"),
    db: Session = Depends(get_db),
):
    """List all uploaded policy documents and their processing status."""
    try:
        query = db.query(SourceDocument)
        if company_id is not None:
            query = query.filter(SourceDocument.company_id == company_id)
        docs = query.order_by(SourceDocument.created_at.desc()).all()
        return DocumentListResponse(
            documents=[SourceDocumentOut.model_validate(d) for d in docs],
            total=len(docs),
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    company_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    """
    Upload a brand guidelines document (.pdf, .docx, or .txt).
    Extracts text and discovers candidate brand rules for human approval.
    """
    try:
        content = await file.read()
        filename = file.filename or "uploaded_document.txt"
        file_ext = os.path.splitext(filename)[1].lower().lstrip(".")

        # 1. Validate file
        is_valid, err_msg = validate_document_file(filename, content)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err_msg)

        # 2. Extract text
        try:
            doc_text = extract_text_from_document(filename, content)
            processing_status = "completed"
            error_message = None
        except ValueError as exc:
            doc_text = ""
            processing_status = "failed"
            error_message = str(exc)

        # 3. Extract candidate rules (all draft / requires approval)
        candidate_rules = []
        if doc_text:
            candidates = extract_candidate_rules_from_text(doc_text, filename)
            for c in candidates:
                candidate_rules.append(
                    CandidateRuleOut(
                        category=c.category,
                        rule_text=c.rule_text,
                        description=c.description,
                        severity=c.severity,
                        source_excerpt=c.source_excerpt,
                        is_approved=False,
                    )
                )

        # 4. Save document record
        doc_record = SourceDocument(
            company_id=company_id,
            filename=filename,
            file_type=file_ext,
            file_size=len(content),
            content_text=doc_text[:50_000] if doc_text else None,  # cap storage for large docs
            processing_status=processing_status,
            error_message=error_message,
            rules_extracted_count=len(candidate_rules),
        )
        db.add(doc_record)
        db.commit()
        db.refresh(doc_record)

        # 5. Persist candidate rules in brand_rules table as draft
        for c in candidate_rules:
            draft_rule = BrandRule(
                company_id=company_id,
                category=c.category,
                rule_text=c.rule_text,
                description=c.description,
                severity=c.severity,
                is_approved=False,  # Human review required
                is_protected=False,
                source_document_id=doc_record.id,
                source_excerpt=c.source_excerpt,
            )
            db.add(draft_rule)
        db.commit()

        message = (
            f"Successfully uploaded and processed '{filename}'. "
            f"Extracted {len(candidate_rules)} candidate rule(s) awaiting approval."
            if processing_status == "completed"
            else f"Failed to process '{filename}': {error_message}"
        )

        return DocumentUploadResponse(
            document=SourceDocumentOut.model_validate(doc_record),
            candidate_rules=candidate_rules,
            message=message,
        )
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error processing document: {exc}")


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document and any unapproved candidate rules linked to it."""
    try:
        doc = db.query(SourceDocument).filter(SourceDocument.id == document_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail=f"Document #{document_id} not found.")
        db.delete(doc)
        db.commit()
        return None
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
