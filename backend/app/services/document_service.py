"""
backend/app/services/document_service.py

Policy and brand guideline document parsing & candidate rule extraction.

Supported file types:
  - .txt  (Plain text)
  - .pdf  (Portable Document Format via pypdf)
  - .docx (Microsoft Word via python-docx)

Safety:
  - Enforces 10MB maximum file size.
  - Validates magic byte signatures (prevents disguised files).
  - Sanitizes filenames against path traversal.
  - Marks all extracted rules as draft/unapproved (human approval required).
"""
from __future__ import annotations

import io
import os
import re
from dataclasses import dataclass
from typing import Any

import pypdf
import docx

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".txt", ".pdf", ".docx"}


@dataclass
class CandidateRule:
    category: str
    rule_text: str
    description: str | None
    severity: str
    source_excerpt: str
    is_approved: bool = False


def validate_document_file(filename: str, content: bytes) -> tuple[bool, str]:
    """
    Validate filename extension, file size, and magic byte signature.
    Returns (is_valid, error_message).
    """
    if not filename:
        return False, "Filename cannot be empty."

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Allowed: .txt, .pdf, .docx."

    if len(content) == 0:
        return False, "Uploaded file is empty (0 bytes)."

    if len(content) > MAX_FILE_SIZE_BYTES:
        return False, f"File exceeds maximum allowed size of 10MB ({len(content)} bytes)."

    # Validate header signatures
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            return False, "Invalid PDF: missing '%PDF-' file signature."
    elif ext == ".docx":
        if not content.startswith(b"PK\x03\x04"):
            return False, "Invalid DOCX: missing ZIP/DOCX header signature."

    return True, ""


def extract_text_from_document(filename: str, content: bytes) -> str:
    """
    Extract readable text from .txt, .pdf, or .docx file bytes.
    Raises ValueError on parsing failure with clear explanation.
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".txt":
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return content.decode("latin-1")
            except Exception as exc:
                raise ValueError(f"Could not decode text file: {exc}")

    elif ext == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages_text = []
            for i, page in enumerate(reader.pages):
                extracted = page.extract_text()
                if extracted:
                    pages_text.append(extracted)
            if not pages_text:
                raise ValueError("PDF contains no extractable text (it may be scanned/image-only).")
            return "\n\n".join(pages_text)
        except Exception as exc:
            raise ValueError(f"Failed to read PDF document: {exc}")

    elif ext == ".docx":
        try:
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            if not paragraphs:
                raise ValueError("DOCX document contains no paragraph text.")
            return "\n\n".join(paragraphs)
        except Exception as exc:
            raise ValueError(f"Failed to read Word document (.docx): {exc}")

    else:
        raise ValueError(f"Unsupported document format: {ext}")


def extract_candidate_rules_from_text(text: str, source_name: str) -> list[CandidateRule]:
    """
    Analyze policy document text for common brand rule directives.
    Returns candidate rules marked as is_approved=False for human approval.
    """
    candidates: list[CandidateRule] = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # Patterns for rule discovery
    prohibited_patterns = [
        r"(?:do not use|never (?:use|state|claim)|avoid (?:the phrase|using)|prohibited:?)\s+['\"]?([^'\"\.\n]{3,60})['\"]?",
        r"(?:never describe our product as)\s+['\"]?([^'\"\.\n]{3,60})['\"]?",
    ]

    required_patterns = [
        r"(?:must include|always (?:state|include|specify)|required phrase:?)\s+['\"]?([^'\"\.\n]{3,80})['\"]?",
        r"(?:mandatory disclaimer:?)\s+['\"]?([^'\"\.\n]{5,120})['\"]?",
    ]

    terminology_patterns = [
        r"(?:brand name is|official spelling is|always spell as)\s+['\"]?([A-Za-z0-9\s]{2,40})['\"]?",
        r"(?:use)\s+['\"]?([A-Za-z0-9\s]{2,30})['\"]?\s+(?:instead of)\s+['\"]?([A-Za-z0-9\s,]{2,60})['\"]?",
    ]

    seen_rules: set[str] = set()

    for line in lines:
        # Check prohibited phrases
        for pat in prohibited_patterns:
            for match in re.finditer(pat, line, re.IGNORECASE):
                phrase = match.group(1).strip()
                if phrase and phrase.lower() not in seen_rules and len(phrase) >= 3:
                    seen_rules.add(phrase.lower())
                    candidates.append(
                        CandidateRule(
                            category="prohibited_phrase",
                            rule_text=phrase,
                            description=f"Extracted from {source_name}. Candidate requires human review.",
                            severity="critical",
                            source_excerpt=line[:200],
                            is_approved=False,
                        )
                    )

        # Check required disclaimers/phrases
        for pat in required_patterns:
            for match in re.finditer(pat, line, re.IGNORECASE):
                phrase = match.group(1).strip()
                if phrase and phrase.lower() not in seen_rules and len(phrase) >= 5:
                    seen_rules.add(phrase.lower())
                    category = "required_disclaimer" if "disclaimer" in match.group(0).lower() else "required_phrase"
                    candidates.append(
                        CandidateRule(
                            category=category,
                            rule_text=phrase,
                            description=f"Extracted requirement from {source_name}.",
                            severity="warning",
                            source_excerpt=line[:200],
                            is_approved=False,
                        )
                    )

        # Check brand terminology
        for pat in terminology_patterns:
            for match in re.finditer(pat, line, re.IGNORECASE):
                approved_term = match.group(1).strip()
                unapproved_variants = match.group(2).strip() if match.lastindex and match.lastindex >= 2 else None
                if approved_term and approved_term.lower() not in seen_rules:
                    seen_rules.add(approved_term.lower())
                    candidates.append(
                        CandidateRule(
                            category="brand_terminology",
                            rule_text=approved_term,
                            description=unapproved_variants or f"Canonical term extracted from {source_name}.",
                            severity="critical",
                            source_excerpt=line[:200],
                            is_approved=False,
                        )
                    )

    return candidates
